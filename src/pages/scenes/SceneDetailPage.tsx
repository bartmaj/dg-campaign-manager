import { useState } from 'react'
import { Link, useParams } from 'react-router'
import DeleteEntityButton from '../../components/DeleteEntityButton/DeleteEntityButton'
import EntityRecentActivity from '../../components/EntityRecentActivity/EntityRecentActivity'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Inline from '../../components/ui/Inline'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateClue } from '../../hooks/useCreateClue'
import { useCreateEdge } from '../../hooks/useCreateEdge'
import { useCreateNpc } from '../../hooks/useCreateNpc'
import { useDeleteScene } from '../../hooks/useDeleteScene'
import { useIncomingEdges } from '../../hooks/useEdges'
import { useScene } from '../../hooks/useScenes'

type AddNpcAtSceneFormProps = { sceneId: string }
function AddNpcAtSceneForm({ sceneId }: AddNpcAtSceneFormProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createNpc = useCreateNpc()
  const createEdge = useCreateEdge()
  const submitting = createNpc.isPending || createEdge.isPending

  async function submit() {
    setError(null)
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setError('NPC name is required.')
      return
    }
    try {
      const npc = await createNpc.mutateAsync({
        name: trimmed,
        description: null,
        profession: null,
        statBlock: { kind: 'simplified', hp: 10, wp: 10 },
        status: 'alive',
        mannerisms: null,
        voice: null,
        secrets: null,
        currentGoal: null,
        factionId: null,
        locationId: null,
        campaignId: null,
      })
      await createEdge.mutateAsync({
        sourceType: 'npc',
        sourceId: npc.id,
        targetType: 'scene',
        targetId: sceneId,
        kind: 'appears_in',
        notes: null,
      })
      setName('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="sm">
      <Field label="Add NPC to this scene">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="NPC name"
        />
      </Field>
      <Toolbar align="start">
        <Button type="button" variant="primary" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add NPC'}
        </Button>
      </Toolbar>
      {error && <p>{error}</p>}
    </Stack>
  )
}

type AddClueAtSceneFormProps = { sceneId: string; scenarioId: string | null }
function AddClueAtSceneForm({ sceneId, scenarioId }: AddClueAtSceneFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createClue = useCreateClue()
  const createEdge = useCreateEdge()
  const submitting = createClue.isPending || createEdge.isPending

  async function submit() {
    setError(null)
    const trimmedName = name.trim()
    const trimmedDesc = description.trim()
    if (trimmedName.length === 0) {
      setError('Clue name is required.')
      return
    }
    try {
      const clue = await createClue.mutateAsync({
        name: trimmedName,
        description: trimmedDesc.length > 0 ? trimmedDesc : null,
        originScenarioId: scenarioId,
        campaignId: null,
      })
      await createEdge.mutateAsync({
        sourceType: 'clue',
        sourceId: clue.id,
        targetType: 'scene',
        targetId: sceneId,
        kind: 'delivered_in',
        notes: null,
      })
      setName('')
      setDescription('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="sm">
      <Field label="Add clue delivered in this scene">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Clue name"
        />
      </Field>
      <Field label="Description">
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
      </Field>
      <Toolbar align="start">
        <Button type="button" variant="primary" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add clue'}
        </Button>
      </Toolbar>
      {error && <p>{error}</p>}
    </Stack>
  )
}

function SceneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: scene, isLoading, error } = useScene(id)
  const { data: incoming = [] } = useIncomingEdges('scene', id)
  const deleteScene = useDeleteScene()

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!scene) return <p>Scene not found.</p>

  return (
    <Stack gap="md">
      <p>
        <Link to="/scenes">← All Scenes</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{scene.name}</Heading>
        <Inline gap="sm">
          <LinkButton href={`/api/scenes/${scene.id}/export`} variant="ghost" download>
            Download as Markdown
          </LinkButton>
          <DeleteEntityButton
            onConfirm={() => deleteScene.mutateAsync(scene.id).then(() => undefined)}
            entityLabel="scene"
            entityName={scene.name}
            redirectTo="/scenes"
          />
        </Inline>
      </Toolbar>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Scenario</Heading>
          <p>
            <Link to={`/scenarios/${scene.scenarioId}`}>{scene.scenarioId}</Link>
          </p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Order index</Heading>
          <p>{scene.orderIndex}</p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Description</Heading>
          <Prose>{scene.description ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Incoming references</Heading>
          {incoming.length === 0 ? (
            <p>—</p>
          ) : (
            <ul>
              {incoming.map((edge) => (
                <li key={edge.id}>
                  <strong>{edge.kind}</strong> from{' '}
                  <Link to={`/${edge.sourceType}s/${edge.sourceId}`}>
                    {edge.sourceType}/{edge.sourceId}
                  </Link>
                  {edge.notes ? ` — ${edge.notes}` : null}
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Card>

      {id && (
        <Card>
          <Stack gap="sm">
            <Heading level={2}>Add NPC</Heading>
            <AddNpcAtSceneForm sceneId={id} />
          </Stack>
        </Card>
      )}

      {id && (
        <Card>
          <Stack gap="sm">
            <Heading level={2}>Add clue</Heading>
            <AddClueAtSceneForm sceneId={id} scenarioId={scene.scenarioId ?? null} />
          </Stack>
        </Card>
      )}

      {id && <EntityRelationships entityType="scene" entityId={id} />}
      {id && <EntityRecentActivity entityType="scene" entityId={id} />}
    </Stack>
  )
}

export default SceneDetailPage
