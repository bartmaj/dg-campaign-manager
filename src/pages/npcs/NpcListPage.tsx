import { useMemo, useState } from 'react'
import PrefetchLink from '../../components/ui/PrefetchLink'
import type { NpcFilter, NpcRow } from '../../api/npcs'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { NPC_STATUSES, type NpcStatus } from '../../../domain/npc'
import Badge from '../../components/ui/Badge'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import EditOnly from '../../components/ui/EditOnly'
import EmptyState from '../../components/ui/EmptyState'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useFactions } from '../../hooks/useFactions'
import { useNpcs } from '../../hooks/useNpcs'

// Status -> Badge variant mapping (used here and on detail pages).
// alive -> ok, missing -> warn, turned -> danger, dead -> neutral.
function statusVariant(s: NpcStatus): 'ok' | 'warn' | 'danger' | 'neutral' {
  if (s === 'alive') return 'ok'
  if (s === 'missing') return 'warn'
  if (s === 'turned') return 'danger'
  return 'neutral'
}

function NpcListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const { data: factions } = useFactions()

  const filter: NpcFilter = useMemo(() => {
    const next: NpcFilter = {}
    if (filterValues.factionId) next.factionId = filterValues.factionId
    if (filterValues.locationId) next.locationId = filterValues.locationId
    if (filterValues.status && (NPC_STATUSES as readonly string[]).includes(filterValues.status)) {
      next.status = filterValues.status as NpcStatus
    }
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useNpcs(filter)

  const fields: FilterBarField[] = useMemo(
    () => [
      { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
      {
        id: 'factionId',
        label: 'Faction',
        type: 'select',
        options: (factions ?? []).map((f) => ({ value: f.id, label: f.name })),
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: NPC_STATUSES.map((s) => ({ value: s, label: s })),
      },
      {
        id: 'locationId',
        label: 'Location ID',
        type: 'text',
        placeholder: 'location id',
      },
    ],
    [factions],
  )

  const columns: ReadonlyArray<DataTableColumn<NpcRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (npc) => <PrefetchLink to={`/npcs/${npc.id}`}>{npc.name}</PrefetchLink>,
    },
    {
      key: 'profession',
      header: 'Profession',
      render: (npc) => npc.profession ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (npc) => <Badge variant={statusVariant(npc.status)}>{npc.status}</Badge>,
    },
    {
      key: 'faction',
      header: 'Faction',
      render: (npc) => npc.factionId ?? '—',
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>NPCs</Heading>
        <EditOnly>
          <LinkButton to="/npcs/new" variant="primary">
            + New NPC
          </LinkButton>
        </EditOnly>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No NPCs match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(npc) => npc.id} />
      )}
    </Stack>
  )
}

export default NpcListPage
