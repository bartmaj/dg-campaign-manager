import { useMemo, useState } from 'react'
import PrefetchLink from '../../components/ui/PrefetchLink'
import type { FactionFilter, FactionRow } from '../../api/factions'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import EditOnly from '../../components/ui/EditOnly'
import EmptyState from '../../components/ui/EmptyState'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
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

  const columns: ReadonlyArray<DataTableColumn<FactionRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (f) => <PrefetchLink to={`/factions/${f.id}`}>{f.name}</PrefetchLink>,
    },
    {
      key: 'agenda',
      header: 'Agenda',
      render: (f) => f.agenda ?? '—',
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>Factions</Heading>
        <EditOnly>
          <LinkButton to="/factions/new" variant="primary">
            + New Faction
          </LinkButton>
        </EditOnly>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No factions match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(f) => f.id} />
      )}
    </Stack>
  )
}

export default FactionListPage
