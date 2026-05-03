import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { LocationFilter, LocationRow } from '../../api/locations'
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

  const columns: ReadonlyArray<DataTableColumn<LocationRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (l) => <Link to={`/locations/${l.id}`}>{l.name}</Link>,
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (l) => l.parentLocationId ?? '—',
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>Locations</Heading>
        <LinkButton to="/locations/new" variant="primary">
          + New Location
        </LinkButton>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No locations match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(l) => l.id} />
      )}
    </Stack>
  )
}

export default LocationListPage
