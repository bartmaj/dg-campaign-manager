import { useMemo, useState } from 'react'
import PrefetchLink from '../../components/ui/PrefetchLink'
import type { ItemFilter, ItemRow } from '../../api/items'
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
import { useItems } from '../../hooks/useItems'

function ItemListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  const filter: ItemFilter = useMemo(() => {
    const next: ItemFilter = {}
    if (filterValues.locationId) next.locationId = filterValues.locationId
    if (filterValues.ownerNpcId) next.ownerNpcId = filterValues.ownerNpcId
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useItems(filter)

  const fields: FilterBarField[] = [
    { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
    { id: 'locationId', label: 'Location ID', type: 'text', placeholder: 'location id' },
    { id: 'ownerNpcId', label: 'Owner NPC ID', type: 'text', placeholder: 'npc id' },
  ]

  const columns: ReadonlyArray<DataTableColumn<ItemRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (i) => <PrefetchLink to={`/items/${i.id}`}>{i.name}</PrefetchLink>,
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (i) => i.ownerNpcId ?? '—',
    },
    {
      key: 'location',
      header: 'Location',
      render: (i) => i.locationId ?? '—',
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>Items</Heading>
        <LinkButton to="/items/new" variant="primary">
          + New Item
        </LinkButton>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No items match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(i) => i.id} />
      )}
    </Stack>
  )
}

export default ItemListPage
