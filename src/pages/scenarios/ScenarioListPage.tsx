import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { ScenarioFilter } from '../../api/scenarios'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { useScenarios } from '../../hooks/useScenarios'

function ScenarioListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  const filter: ScenarioFilter = useMemo(() => {
    const next: ScenarioFilter = {}
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useScenarios(filter)

  const fields: FilterBarField[] = [
    { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
  ]

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Scenarios</h1>
        <Link to="/scenarios/new">+ New scenario</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No scenarios match the current filters.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((s) => {
            const preview = s.description
              ? s.description.length > 80
                ? `${s.description.slice(0, 80)}…`
                : s.description
              : null
            return (
              <li key={s.id}>
                <Link to={`/scenarios/${s.id}`}>{s.name}</Link>
                {preview ? ` — ${preview}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ScenarioListPage
