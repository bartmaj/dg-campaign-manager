import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { ClueFilter, ClueRow } from '../../api/clues'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useClues } from '../../hooks/useClues'
import { useScenarios } from '../../hooks/useScenarios'

function preview(text: string | null): string {
  if (!text) return '—'
  return text.length > 80 ? `${text.slice(0, 80)}…` : text
}

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

  const columns: ReadonlyArray<DataTableColumn<ClueRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => <Link to={`/clues/${c.id}`}>{c.name}</Link>,
    },
    {
      key: 'origin',
      header: 'Origin',
      render: (c) => c.originScenarioId ?? '—',
    },
    {
      key: 'description',
      header: 'Description',
      render: (c) => preview(c.description),
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>Clues</Heading>
        <LinkButton to="/clues/new" variant="primary">
          + New Clue
        </LinkButton>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No clues match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(c) => c.id} />
      )}
    </Stack>
  )
}

export default ClueListPage
