import { Link } from 'react-router'
import { useScenarios } from '../../hooks/useScenarios'

function ScenarioListPage() {
  const { data, isLoading, error } = useScenarios()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Scenarios</h1>
        <Link to="/scenarios/new">+ New scenario</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No scenarios yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((s) => {
            const preview = s.description
              ? s.description.length > 80
                ? `${s.description.slice(0, 80)}…`
                : s.description
              : null
            return (
              <li key={s.id}>
                <Link to={`/scenarios/${s.id}`}>{s.name}</Link>
                {preview ? ` — ${preview}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ScenarioListPage
