import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { ClueFilter } from '../../api/clues'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { useClues } from '../../hooks/useClues'
import { useScenarios } from '../../hooks/useScenarios'

function ClueListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const { data: scenarios } = useScenarios()

  const filter: ClueFilter = useMemo(() => {
    const next: ClueFilter = {}
    if (filterValues.originScenarioId) next.originScenarioId = filterValues.originScenarioId
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useClues(filter)

  const fields: FilterBarField[] = useMemo(
    () => [
      { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
      {
        id: 'originScenarioId',
        label: 'Origin scenario',
        type: 'select',
        options: (scenarios ?? []).map((s) => ({ value: s.id, label: s.name })),
      },
    ],
    [scenarios],
  )

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Clues</h1>
        <Link to="/clues/new">+ New Clue</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No clues match the current filters.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((clue) => {
            const preview = clue.description
              ? clue.description.length > 80
                ? `${clue.description.slice(0, 80)}…`
                : clue.description
              : null
            return (
              <li key={clue.id}>
                <Link to={`/clues/${clue.id}`}>{clue.name}</Link>
                {clue.originScenarioId ? ` — origin: ${clue.originScenarioId}` : ''}
                {preview ? ` — ${preview}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ClueListPage
