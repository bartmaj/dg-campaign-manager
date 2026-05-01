import { Link, useParams } from 'react-router'
import { useLocation } from '../../hooks/useLocations'

function LocationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: location, isLoading, error } = useLocation(id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!location) return <p>Location not found.</p>

  return (
    <section>
      <p>
        <Link to="/locations">← All Locations</Link>
      </p>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{location.name}</h1>
        <a href={`/api/locations/${location.id}/export`} download>
          Download as Markdown
        </a>
      </header>

      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{location.description ?? '—'}</p>

      <h2>Parent Location</h2>
      <p>
        {location.parentLocationId ? (
          <Link to={`/locations/${location.parentLocationId}`}>{location.parentLocationId}</Link>
        ) : (
          '—'
        )}
      </p>

      <h2>Contents</h2>
      <p>
        <em>Items and NPCs at this location — surfaced in M2.2A via polymorphic edges.</em>
      </p>
    </section>
  )
}

export default LocationDetailPage
