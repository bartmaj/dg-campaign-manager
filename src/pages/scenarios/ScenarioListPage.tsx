import { useMemo, useState } from 'react'
import PrefetchLink from '../../components/ui/PrefetchLink'
import type { ScenarioFilter, ScenarioRow } from '../../api/scenarios'
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
import { useScenarios } from '../../hooks/useScenarios'

function preview(text: string | null): string {
  if (!text) return '—'
  return text.length > 80 ? `${text.slice(0, 80)}…` : text
}

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

  const columns: ReadonlyArray<DataTableColumn<ScenarioRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (s) => <PrefetchLink to={`/scenarios/${s.id}`}>{s.name}</PrefetchLink>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (s) => preview(s.description),
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>Scenarios</Heading>
        <LinkButton to="/scenarios/new" variant="primary">
          + New scenario
        </LinkButton>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No scenarios match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(s) => s.id} />
      )}
    </Stack>
  )
}

export default ScenarioListPage
