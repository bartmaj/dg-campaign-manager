import { Link } from 'react-router'
import { useScenes } from '../../hooks/useScenes'

function SceneListPage() {
  const { data, isLoading, error } = useScenes()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Scenes</h1>
        <Link to="/scenes/new">+ New scene</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No scenes yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((s) => (
            <li key={s.id}>
              <Link to={`/scenes/${s.id}`}>{s.name}</Link>
              {' — scenario '}
              <Link to={`/scenarios/${s.scenarioId}`}>{s.scenarioId}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default SceneListPage
