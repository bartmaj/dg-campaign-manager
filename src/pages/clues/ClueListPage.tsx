import { Link } from 'react-router'
import { useClues } from '../../hooks/useClues'

function ClueListPage() {
  const { data, isLoading, error } = useClues()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Clues</h1>
        <Link to="/clues/new">+ New Clue</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No clues yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((clue) => {
            const preview = clue.description
              ? clue.description.length > 80
                ? `${clue.description.slice(0, 80)}…`
                : clue.description
              : null
            return (
              <li key={clue.id}>
                <Link to={`/clues/${clue.id}`}>{clue.name}</Link>
                {clue.originScenarioId ? ` — origin: ${clue.originScenarioId}` : ''}
                {preview ? ` — ${preview}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ClueListPage
