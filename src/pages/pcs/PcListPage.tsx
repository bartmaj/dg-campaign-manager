// Modularity rule (#033): pages compose primitives from src/components/ui only.
// `className` and `style` should not appear in this file or its siblings.
// All visual styling lives in primitives; pages declare structure and content.
import { useMemo, useState } from 'react'
import type { PcFilter } from '../../api/pcs'
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
import PrefetchLink from '../../components/ui/PrefetchLink'
import { usePcs } from '../../hooks/usePcs'
import type { PcRow } from '../../api/pcs'

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

  const columns: ReadonlyArray<DataTableColumn<PcRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (pc) => <PrefetchLink to={`/pcs/${pc.id}`}>{pc.name}</PrefetchLink>,
    },
    {
      key: 'profession',
      header: 'Profession',
      render: (pc) => pc.profession ?? '—',
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>PCs</Heading>
        <EditOnly>
          <LinkButton to="/pcs/new" variant="primary">
            + New PC
          </LinkButton>
        </EditOnly>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && (
        <EmptyState
          title="No PCs match the current filters."
          description="Try clearing filters or create a new PC."
        />
      )}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(pc) => pc.id} />
      )}
    </Stack>
  )
}

export default PcListPage
