// LocationContext — curated four-panel "what's here" view for a Location:
// linked clues, present NPCs, items at the location, and prior session
// events. Composes design-system primitives only — no inline styles.
//
// Reuses existing endpoints/hooks (see #019 scope):
//   - useIncomingEdges('location', id) for clue→location 'points_to'
//     and npc→location 'occupies' / 'frequents' edges
//   - useNpcs({ locationId }) for the typed FK NPC list
//   - useItems({ locationId }) for items at this location
//   - useSessionsInvolving('location', id) for session activity
//   - useEntityNames(...) for batched name resolution
import { useMemo } from 'react'
import { Link } from 'react-router'
import type { SessionRow } from '../../api/sessions'
import { useIncomingEdges } from '../../hooks/useEdges'
import { useEntityNames } from '../../hooks/useEntityNames'
import { useItems } from '../../hooks/useItems'
import { useNpcs } from '../../hooks/useNpcs'
import { useSessionsInvolving } from '../../hooks/useSessions'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Heading from '../ui/Heading'
import Inline from '../ui/Inline'
import Stack from '../ui/Stack'

type Props = {
  locationId: string
}

type NpcLinkage = 'fk' | 'occupies' | 'frequents'

const NPC_LINKAGE_LABEL: Record<NpcLinkage, string> = {
  fk: 'current location',
  occupies: 'occupies',
  frequents: 'frequents',
}

function dateKey(row: SessionRow): number | null {
  const v = row.realWorldDate
  if (!v) return null
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : t
}

/**
 * Sort: most recent realWorldDate first; nulls last. Mirrors
 * EntityRecentActivity sort so the two surfaces stay consistent.
 */
function sortMostRecent(rows: readonly SessionRow[]): SessionRow[] {
  return [...rows].sort((a, b) => {
    const ta = dateKey(a)
    const tb = dateKey(b)
    if (ta === null && tb === null) return 0
    if (ta === null) return 1
    if (tb === null) return -1
    return tb - ta
  })
}

function LinkedCluesPanel({ locationId }: { locationId: string }) {
  const { data: incoming = [] } = useIncomingEdges('location', locationId)
  const clueEdges = useMemo(
    () => incoming.filter((e) => e.sourceType === 'clue' && e.kind === 'points_to'),
    [incoming],
  )
  const ids = useMemo(() => clueEdges.map((e) => e.sourceId), [clueEdges])
  const namesQuery = useEntityNames('clue', ids)
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of namesQuery.data?.items ?? []) m.set(r.id, r.name)
    return m
  }, [namesQuery.data])

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Linked clues</Heading>
        {clueEdges.length === 0 ? (
          <EmptyState title="No clues linked." />
        ) : (
          <ul>
            {clueEdges.map((e) => {
              const name = nameById.get(e.sourceId)
              return (
                <li key={e.id}>
                  <Link to={`/clues/${e.sourceId}`}>{name ?? e.sourceId}</Link>
                  {e.notes ? ` — ${e.notes}` : null}
                </li>
              )
            })}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

function PresentNpcsPanel({ locationId }: { locationId: string }) {
  const { data: fkNpcs = [] } = useNpcs({ locationId })
  const { data: incoming = [] } = useIncomingEdges('location', locationId)

  // Edge-linked NPCs: npc→location 'occupies' or 'frequents'.
  const npcEdges = useMemo(
    () =>
      incoming.filter(
        (e) => e.sourceType === 'npc' && (e.kind === 'occupies' || e.kind === 'frequents'),
      ),
    [incoming],
  )

  // Dedupe by NPC id. FK takes precedence; edge linkages get added if the
  // NPC isn't already in the FK list.
  type Row = { id: string; name?: string; linkage: NpcLinkage }
  const merged = useMemo<Row[]>(() => {
    const seen = new Map<string, Row>()
    for (const npc of fkNpcs) {
      seen.set(npc.id, { id: npc.id, name: npc.name, linkage: 'fk' })
    }
    for (const e of npcEdges) {
      if (seen.has(e.sourceId)) continue
      seen.set(e.sourceId, {
        id: e.sourceId,
        linkage: e.kind === 'occupies' ? 'occupies' : 'frequents',
      })
    }
    return [...seen.values()]
  }, [fkNpcs, npcEdges])

  // Resolve names for edge-only NPCs (FK rows already carry their name).
  const idsNeedingNames = useMemo(() => merged.filter((r) => !r.name).map((r) => r.id), [merged])
  const namesQuery = useEntityNames('npc', idsNeedingNames)
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of namesQuery.data?.items ?? []) m.set(r.id, r.name)
    return m
  }, [namesQuery.data])

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Present NPCs</Heading>
        {merged.length === 0 ? (
          <EmptyState title="No NPCs here." />
        ) : (
          <ul>
            {merged.map((r) => {
              const name = r.name ?? nameById.get(r.id)
              return (
                <li key={r.id}>
                  <Inline gap="sm">
                    <Link to={`/npcs/${r.id}`}>{name ?? r.id}</Link>
                    <Badge>{NPC_LINKAGE_LABEL[r.linkage]}</Badge>
                  </Inline>
                </li>
              )
            })}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

function ItemsAtLocationPanel({ locationId }: { locationId: string }) {
  const { data: items = [] } = useItems({ locationId })

  // Enrich with owner-NPC names where present (one batched lookup).
  const ownerIds = useMemo(
    () => items.map((i) => i.ownerNpcId).filter((v): v is string => Boolean(v)),
    [items],
  )
  const namesQuery = useEntityNames('npc', ownerIds)
  const ownerNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of namesQuery.data?.items ?? []) m.set(r.id, r.name)
    return m
  }, [namesQuery.data])

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Items at this location</Heading>
        {items.length === 0 ? (
          <EmptyState title="No items recorded." />
        ) : (
          <ul>
            {items.map((it) => {
              const ownerName = it.ownerNpcId ? ownerNameById.get(it.ownerNpcId) : null
              return (
                <li key={it.id}>
                  <Link to={`/items/${it.id}`}>{it.name}</Link>
                  {it.ownerNpcId ? ` — held by ${ownerName ?? it.ownerNpcId}` : null}
                </li>
              )
            })}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

function SessionsHerePanel({ locationId }: { locationId: string }) {
  const { data: sessions = [] } = useSessionsInvolving('location', locationId)
  const sorted = useMemo(() => sortMostRecent(sessions).slice(0, 10), [sessions])

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Sessions at this location</Heading>
        {sorted.length === 0 ? (
          <EmptyState title="No session activity yet." />
        ) : (
          <ul>
            {sorted.map((s) => {
              const irl = s.realWorldDate
                ? new Date(s.realWorldDate).toISOString().slice(0, 10)
                : null
              const inGame = s.inGameDate
              return (
                <li key={s.id}>
                  <Link to={`/sessions/${s.id}`}>{s.name}</Link>
                  {inGame ? ` · in-game ${inGame}` : ''}
                  {irl ? ` · IRL ${irl}` : ''}
                </li>
              )
            })}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

function LocationContext({ locationId }: Props) {
  return (
    <Stack gap="md">
      <LinkedCluesPanel locationId={locationId} />
      <PresentNpcsPanel locationId={locationId} />
      <ItemsAtLocationPanel locationId={locationId} />
      <SessionsHerePanel locationId={locationId} />
    </Stack>
  )
}

export default LocationContext
