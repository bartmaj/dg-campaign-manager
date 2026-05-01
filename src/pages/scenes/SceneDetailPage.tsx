import { Link, useParams } from 'react-router'
import { useIncomingEdges } from '../../hooks/useEdges'
import { useScene } from '../../hooks/useScenes'

function SceneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: scene, isLoading, error } = useScene(id)
  const { data: incoming = [] } = useIncomingEdges('scene', id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!scene) return <p>Scene not found.</p>

  return (
    <section>
      <p>
        <Link to="/scenes">← All Scenes</Link>
      </p>
      <h1>{scene.name}</h1>

      <h2>Scenario</h2>
      <p>
        <Link to={`/scenarios/${scene.scenarioId}`}>{scene.scenarioId}</Link>
      </p>

      <h2>Order index</h2>
      <p>{scene.orderIndex}</p>

      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{scene.description ?? '—'}</p>

      <h2>Incoming references</h2>
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
    </section>
  )
}

export default SceneDetailPage
