import { Link, useParams } from 'react-router'
import { useScenario, useScenarios } from '../../hooks/useScenarios'
import { useScenes } from '../../hooks/useScenes'

function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: scenario, isLoading, error } = useScenario(id)
  const { data: scenes = [] } = useScenes(id)
  // Pre-fetch scenarios list so the back link is responsive.
  useScenarios()

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!scenario) return <p>Scenario not found.</p>

  return (
    <section>
      <p>
        <Link to="/scenarios">← All Scenarios</Link>
      </p>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{scenario.name}</h1>
        <a href={`/api/scenarios/${scenario.id}/export`} download>
          Download as Markdown
        </a>
      </header>
      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{scenario.description ?? '—'}</p>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Scenes</h2>
        <Link to={`/scenes/new?scenarioId=${encodeURIComponent(scenario.id)}`}>+ New scene</Link>
      </header>
      {scenes.length === 0 ? (
        <p>—</p>
      ) : (
        <ol>
          {scenes.map((s) => (
            <li key={s.id}>
              <Link to={`/scenes/${s.id}`}>{s.name}</Link>
              {s.description ? ` — ${s.description.slice(0, 80)}` : ''}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default ScenarioDetailPage
