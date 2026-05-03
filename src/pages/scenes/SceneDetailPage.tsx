import { Link, useParams } from 'react-router'
import Card from '../../components/ui/Card'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useIncomingEdges } from '../../hooks/useEdges'
import { useScene } from '../../hooks/useScenes'

function SceneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: scene, isLoading, error } = useScene(id)
  const { data: incoming = [] } = useIncomingEdges('scene', id)

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
        <LinkButton href={`/api/scenes/${scene.id}/export`} variant="ghost" download>
          Download as Markdown
        </LinkButton>
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
          <p>
            <em>
              To add a reference (e.g., a clue delivered in this scene), open that source entity's
              detail page and add an edge there.
            </em>
          </p>
        </Stack>
      </Card>
    </Stack>
  )
}

export default SceneDetailPage
