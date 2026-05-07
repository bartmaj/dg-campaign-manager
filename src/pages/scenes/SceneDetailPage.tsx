import { useState } from 'react'
import { Link, useParams } from 'react-router'
import DeleteEntityButton from '../../components/DeleteEntityButton/DeleteEntityButton'
import EditOnly from '../../components/ui/EditOnly'
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
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useClues } from '../../hooks/useClues'
import { useCreateClue } from '../../hooks/useCreateClue'
import { useCreateEdge } from '../../hooks/useCreateEdge'
import { useCreateNpc } from '../../hooks/useCreateNpc'
import { useDeleteScene } from '../../hooks/useDeleteScene'
import { useIncomingEdges } from '../../hooks/useEdges'
import { useNpcs } from '../../hooks/useNpcs'
import { useScene } from '../../hooks/useScenes'

type AddNpcAtSceneFormProps = { sceneId: string }
function AddNpcAtSceneForm({ sceneId }: AddNpcAtSceneFormProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [name, setName] = useState('')
  const [npcId, setNpcId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createNpc = useCreateNpc()
  const createEdge = useCreateEdge()
  const npcsQuery = useNpcs()
  const npcs = npcsQuery.data ?? []
  const submitting = createNpc.isPending || createEdge.isPending

  async function submit() {
    setError(null)
    try {
      let resolvedNpcId: string
      if (mode === 'existing') {
        if (npcId.trim() === '') {
          setError('Pick an existing NPC.')
          return
        }
        resolvedNpcId = npcId.trim()
      } else {
        const trimmed = name.trim()
        if (trimmed.length === 0) {
          setError('NPC name is required.')
          return
        }
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
        resolvedNpcId = npc.id
      }
      await createEdge.mutateAsync({
        sourceType: 'npc',
        sourceId: resolvedNpcId,
        targetType: 'scene',
        targetId: sceneId,
        kind: 'appears_in',
        notes: null,
      })
      setName('')
      setNpcId('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="sm">
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as 'existing' | 'new')}>
          <option value="existing">Existing NPC</option>
          <option value="new">New NPC</option>
        </Select>
      </Field>
      {mode === 'existing' ? (
        <Field
          label="NPC"
          helper={
            npcsQuery.isLoading
              ? 'Loading NPCs…'
              : npcs.length === 0
                ? 'No NPCs yet — create one first.'
                : undefined
          }
        >
          <Select
            value={npcId}
            onChange={(e) => setNpcId(e.target.value)}
            disabled={npcs.length === 0}
          >
            <option value="">— Select an NPC —</option>
            {npcs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Add NPC to this scene">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="NPC name"
          />
        </Field>
      )}
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
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [clueId, setClueId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createClue = useCreateClue()
  const createEdge = useCreateEdge()
  const cluesQuery = useClues()
  const clues = cluesQuery.data ?? []
  const submitting = createClue.isPending || createEdge.isPending

  async function submit() {
    setError(null)
    try {
      let resolvedClueId: string
      if (mode === 'existing') {
        if (clueId.trim() === '') {
          setError('Pick an existing clue.')
          return
        }
        resolvedClueId = clueId.trim()
      } else {
        const trimmedName = name.trim()
        const trimmedDesc = description.trim()
        if (trimmedName.length === 0) {
          setError('Clue name is required.')
          return
        }
        const clue = await createClue.mutateAsync({
          name: trimmedName,
          description: trimmedDesc.length > 0 ? trimmedDesc : null,
          originScenarioId: scenarioId,
          campaignId: null,
        })
        resolvedClueId = clue.id
      }
      await createEdge.mutateAsync({
        sourceType: 'clue',
        sourceId: resolvedClueId,
        targetType: 'scene',
        targetId: sceneId,
        kind: 'delivered_in',
        notes: null,
      })
      setName('')
      setDescription('')
      setClueId('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="sm">
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as 'existing' | 'new')}>
          <option value="existing">Existing clue</option>
          <option value="new">New clue</option>
        </Select>
      </Field>
      {mode === 'existing' ? (
        <Field
          label="Clue"
          helper={
            cluesQuery.isLoading
              ? 'Loading clues…'
              : clues.length === 0
                ? 'No clues yet — create one first.'
                : undefined
          }
        >
          <Select
            value={clueId}
            onChange={(e) => setClueId(e.target.value)}
            disabled={clues.length === 0}
          >
            <option value="">— Select a clue —</option>
            {clues.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <>
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
        </>
      )}
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
          <EditOnly>
            <DeleteEntityButton
              onConfirm={() => deleteScene.mutateAsync(scene.id).then(() => undefined)}
              entityLabel="scene"
              entityName={scene.name}
              redirectTo="/scenes"
            />
          </EditOnly>
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
        <EditOnly>
          <Card>
            <Stack gap="sm">
              <Heading level={2}>Add NPC</Heading>
              <AddNpcAtSceneForm sceneId={id} />
            </Stack>
          </Card>
        </EditOnly>
      )}

      {id && (
        <EditOnly>
          <Card>
            <Stack gap="sm">
              <Heading level={2}>Add clue</Heading>
              <AddClueAtSceneForm sceneId={id} scenarioId={scene.scenarioId ?? null} />
            </Stack>
          </Card>
        </EditOnly>
      )}

      {id && <EntityRelationships entityType="scene" entityId={id} />}
      {id && <EntityRecentActivity entityType="scene" entityId={id} />}
    </Stack>
  )
}

export default SceneDetailPage
