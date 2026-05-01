import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { LocationFilter } from '../../api/locations'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { useLocations } from '../../hooks/useLocations'

function LocationListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  const filter: LocationFilter = useMemo(() => {
    const next: LocationFilter = {}
    if (filterValues.parentLocationId) next.parentLocationId = filterValues.parentLocationId
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useLocations(filter)

  const fields: FilterBarField[] = [
    { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
    {
      id: 'parentLocationId',
      label: 'Parent location ID',
      type: 'text',
      placeholder: 'parent id',
    },
  ]

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Locations</h1>
        <Link to="/locations/new">+ New Location</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No locations match the current filters.</p>}
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
