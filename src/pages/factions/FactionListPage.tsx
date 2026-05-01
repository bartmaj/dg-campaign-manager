import { Link } from 'react-router'
import { useFactions } from '../../hooks/useFactions'

function FactionListPage() {
  const { data, isLoading, error } = useFactions()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Factions</h1>
        <Link to="/factions/new">+ New Faction</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No factions yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((faction) => (
            <li key={faction.id}>
              <Link to={`/factions/${faction.id}`}>{faction.name}</Link>
              {faction.agenda ? ` — ${faction.agenda}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default FactionListPage
