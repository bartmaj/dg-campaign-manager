import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { FactionFilter } from '../../api/factions'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { useFactions } from '../../hooks/useFactions'

function FactionListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  const filter: FactionFilter = useMemo(() => {
    const next: FactionFilter = {}
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useFactions(filter)

  const fields: FilterBarField[] = [
    { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
  ]

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Factions</h1>
        <Link to="/factions/new">+ New Faction</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No factions match the current filters.</p>}
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
