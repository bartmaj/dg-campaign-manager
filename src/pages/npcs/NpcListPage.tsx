import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { NpcFilter } from '../../api/npcs'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { NPC_STATUSES, type NpcStatus } from '../../../domain/npc'
import { useFactions } from '../../hooks/useFactions'
import { useNpcs } from '../../hooks/useNpcs'

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
      {
        id: 'q',
        label: 'Name',
        type: 'text',
        placeholder: 'search by name',
      },
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

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>NPCs</h1>
        <Link to="/npcs/new">+ New NPC</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No NPCs match the current filters.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((npc) => (
            <li key={npc.id}>
              <Link to={`/npcs/${npc.id}`}>{npc.name}</Link>
              {npc.profession ? ` — ${npc.profession}` : ''} · <em>{npc.status}</em>
              {npc.factionId ? ` · faction: ${npc.factionId}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default NpcListPage
