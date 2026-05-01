import { Link } from 'react-router'
import { usePcs } from '../../hooks/usePcs'

function PcListPage() {
  const { data, isLoading, error } = usePcs()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>PCs</h1>
        <Link to="/pcs/new">+ New PC</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No PCs yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((pc) => (
            <li key={pc.id}>
              <Link to={`/pcs/${pc.id}`}>{pc.name}</Link>
              {pc.profession ? ` — ${pc.profession}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default PcListPage
