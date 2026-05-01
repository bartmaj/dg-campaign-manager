import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { PcFilter } from '../../api/pcs'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { usePcs } from '../../hooks/usePcs'

function PcListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  const filter: PcFilter = useMemo(() => {
    const next: PcFilter = {}
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = usePcs(filter)

  const fields: FilterBarField[] = [
    { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
  ]

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>PCs</h1>
        <Link to="/pcs/new">+ New PC</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No PCs match the current filters.</p>}
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
