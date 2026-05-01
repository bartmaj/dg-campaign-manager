import { Link, useParams } from 'react-router'
import { useFaction } from '../../hooks/useFactions'
import { useIncomingEdges } from '../../hooks/useEdges'

function FactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: faction, isLoading, error } = useFaction(id)
  // Reverse-ref: every edge pointing AT this faction. The full
  // edge-management UI lands in #018; here we filter client-side to
  // demonstrate the foundation.
  const { data: incomingEdges = [] } = useIncomingEdges('faction', id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!faction) return <p>Faction not found.</p>

  const implicatingClues = incomingEdges.filter(
    (e) => e.sourceType === 'clue' && e.kind === 'implicates',
  )

  return (
    <section>
      <p>
        <Link to="/factions">← All Factions</Link>
      </p>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{faction.name}</h1>
        <a href={`/api/factions/${faction.id}/export`} download>
          Download as Markdown
        </a>
      </header>

      <h2>Agenda</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{faction.agenda ?? '—'}</p>

      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{faction.description ?? '—'}</p>

      <h2>Implicating clues</h2>
      {implicatingClues.length === 0 ? (
        <p>—</p>
      ) : (
        <ul>
          {implicatingClues.map((edge) => (
            <li key={edge.id}>
              <Link to={`/clues/${edge.sourceId}`}>{edge.sourceId}</Link>
              {edge.notes ? ` — ${edge.notes}` : null}
            </li>
          ))}
        </ul>
      )}

      <h2>Members</h2>
      <p>
        <em>Member NPCs — surfaced in M2.2A via polymorphic edges.</em>
      </p>
    </section>
  )
}

export default FactionDetailPage
