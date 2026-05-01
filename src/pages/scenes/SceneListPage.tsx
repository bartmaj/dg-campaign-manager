import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { SceneFilter } from '../../api/scenes'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { useScenarios } from '../../hooks/useScenarios'
import { useScenes } from '../../hooks/useScenes'

function SceneListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const { data: scenarios } = useScenarios()

  const filter: SceneFilter = useMemo(() => {
    const next: SceneFilter = {}
    if (filterValues.scenarioId) next.scenarioId = filterValues.scenarioId
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useScenes(filter)

  const fields: FilterBarField[] = useMemo(
    () => [
      { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
      {
        id: 'scenarioId',
        label: 'Scenario',
        type: 'select',
        options: (scenarios ?? []).map((s) => ({ value: s.id, label: s.name })),
      },
    ],
    [scenarios],
  )

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Scenes</h1>
        <Link to="/scenes/new">+ New scene</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No scenes match the current filters.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((s) => (
            <li key={s.id}>
              <Link to={`/scenes/${s.id}`}>{s.name}</Link>
              {' — scenario '}
              <Link to={`/scenarios/${s.scenarioId}`}>{s.scenarioId}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default SceneListPage
