import { Link } from 'react-router'
import { useLocations } from '../../hooks/useLocations'

function LocationListPage() {
  const { data, isLoading, error } = useLocations()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Locations</h1>
        <Link to="/locations/new">+ New Location</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No locations yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((location) => (
            <li key={location.id}>
              <Link to={`/locations/${location.id}`}>{location.name}</Link>
              {location.parentLocationId ? ` · in ${location.parentLocationId}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default LocationListPage
