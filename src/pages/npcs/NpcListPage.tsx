import { Link } from 'react-router'
import { useNpcs } from '../../hooks/useNpcs'

function NpcListPage() {
  const { data, isLoading, error } = useNpcs()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>NPCs</h1>
        <Link to="/npcs/new">+ New NPC</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No NPCs yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((npc) => (
            <li key={npc.id}>
              <Link to={`/npcs/${npc.id}`}>{npc.name}</Link>
              {npc.profession ? ` — ${npc.profession}` : ''} · <em>{npc.status}</em>
              {npc.factionId ? ` · faction: ${npc.factionId}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default NpcListPage
