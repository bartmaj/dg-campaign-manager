import { useMemo, useState } from 'react'
import PrefetchLink from '../../components/ui/PrefetchLink'
import type { SessionFilter, SessionOrderBy, SessionRow } from '../../api/sessions'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import Button from '../../components/ui/Button'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import Heading from '../../components/ui/Heading'
import Inline from '../../components/ui/Inline'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useSessions } from '../../hooks/useSessions'

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return '—'
  if (start && end) return `${start} – ${end}`
  return start ?? end ?? '—'
}

function formatRealWorld(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? d : dt.toISOString().slice(0, 10)
}

function SessionListPage() {
  const [orderBy, setOrderBy] = useState<SessionOrderBy>('realWorld')
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  const filter: SessionFilter = useMemo(() => {
    const next: SessionFilter = {}
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useSessions(orderBy, filter)

  const fields: FilterBarField[] = [
    { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
  ]

  const columns: ReadonlyArray<DataTableColumn<SessionRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (s) => <PrefetchLink to={`/sessions/${s.id}`}>{s.name}</PrefetchLink>,
    },
    {
      key: 'realWorld',
      header: 'Real-world',
      render: (s) => formatRealWorld(s.realWorldDate),
    },
    {
      key: 'inGame',
      header: 'In-game',
      render: (s) => formatRange(s.inGameDate, s.inGameDateEnd),
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>Sessions</Heading>
        <LinkButton to="/sessions/new" variant="primary">
          + New session
        </LinkButton>
      </Toolbar>

      <Inline gap="sm">
        <Button
          variant={orderBy === 'realWorld' ? 'primary' : 'secondary'}
          onClick={() => setOrderBy('realWorld')}
          disabled={orderBy === 'realWorld'}
        >
          Real-world order
        </Button>
        <Button
          variant={orderBy === 'inGame' ? 'primary' : 'secondary'}
          onClick={() => setOrderBy('inGame')}
          disabled={orderBy === 'inGame'}
        >
          In-game order
        </Button>
      </Inline>

      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />

      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No sessions match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(s) => s.id} />
      )}
    </Stack>
  )
}

export default SessionListPage
