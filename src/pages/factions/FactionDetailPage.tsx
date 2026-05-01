import { Link, useParams } from 'react-router'
import { useFaction } from '../../hooks/useFactions'

function FactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: faction, isLoading, error } = useFaction(id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!faction) return <p>Faction not found.</p>

  return (
    <section>
      <p>
        <Link to="/factions">← All Factions</Link>
      </p>
      <h1>{faction.name}</h1>

      <h2>Agenda</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{faction.agenda ?? '—'}</p>

      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{faction.description ?? '—'}</p>

      <h2>Members</h2>
      <p>
        <em>Member NPCs — surfaced in M2.2A via polymorphic edges.</em>
      </p>
    </section>
  )
}

export default FactionDetailPage
