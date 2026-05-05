// EntityRelationships — generic incoming/outgoing typed-edge card.
// Composes design-system primitives only — no inline styles or className.
// Resolves related-entity names via batched /api/search/names lookups
// (one batch per related EntityType), with raw-id fallback during load.
import { useMemo } from 'react'
import { Link } from 'react-router'
import type { EntityType } from '../../../db/schema'
import type { EdgeRow } from '../../api/edges'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Heading from '../ui/Heading'
import Inline from '../ui/Inline'
import Stack from '../ui/Stack'
import { useIncomingEdges, useOutgoingEdges } from '../../hooks/useEdges'
import { useEntityNames } from '../../hooks/useEntityNames'

type Props = {
  entityType: EntityType
  entityId: string
}

type Side = {
  edge: EdgeRow
  // The "other" side — the endpoint that is NOT the focal entity.
  otherType: EntityType
  otherId: string
}

function groupBy<T, K extends string>(items: readonly T[], keyFn: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>
  for (const item of items) {
    const k = keyFn(item)
    if (!out[k]) out[k] = []
    out[k].push(item)
  }
  return out
}

/**
 * Sub-card that batches name lookup for one (otherType) bucket and
 * renders one heading + edge list. Hooks must run unconditionally,
 * which is why each type bucket is its own component instance.
 */
function NamedEdgeGroup({
  heading,
  otherType,
  sides,
}: {
  heading: string
  otherType: EntityType
  sides: readonly Side[]
}) {
  const ids = useMemo(() => sides.map((s) => s.otherId), [sides])
  const namesQuery = useEntityNames(otherType, ids)
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of namesQuery.data?.items ?? []) m.set(r.id, r.name)
    return m
  }, [namesQuery.data])

  // Group within the type bucket by edge kind so the user sees
  // "mentions: Foo, Bar" rather than a flat shuffle.
  const byKind = useMemo(() => groupBy(sides, (s) => s.edge.kind), [sides])
  const kinds = Object.keys(byKind).sort()

  return (
    <Stack gap="xs">
      <Heading level={3}>{heading}</Heading>
      <Stack gap="xs">
        {kinds.map((k) => {
          const list = byKind[k] ?? []
          return (
            <Inline key={k} gap="sm">
              <Badge>{k}</Badge>
              <ul>
                {list.map((s) => {
                  const name = nameById.get(s.otherId)
                  return (
                    <li key={s.edge.id}>
                      <Link to={`/${s.otherType}s/${s.otherId}`}>
                        {name ?? <span className="font-mono text-xs">{s.otherId}</span>}
                      </Link>
                      {s.edge.notes ? ` — ${s.edge.notes}` : null}
                    </li>
                  )
                })}
              </ul>
            </Inline>
          )
        })}
      </Stack>
    </Stack>
  )
}

const TYPE_LABELS: Record<EntityType, string> = {
  campaign: 'Campaigns',
  scenario: 'Scenarios',
  scene: 'Scenes',
  npc: 'NPCs',
  pc: 'PCs',
  clue: 'Clues',
  item: 'Items',
  faction: 'Factions',
  location: 'Locations',
  session: 'Sessions',
  bond: 'Bonds',
}

function EntityRelationships({ entityType, entityId }: Props) {
  const { data: outgoing = [] } = useOutgoingEdges(entityType, entityId)
  const { data: incoming = [] } = useIncomingEdges(entityType, entityId)

  const outgoingSides: Side[] = useMemo(
    () =>
      outgoing
        .filter((e) => Boolean(e.targetId))
        .map((e) => ({ edge: e, otherType: e.targetType, otherId: e.targetId })),
    [outgoing],
  )
  const incomingSides: Side[] = useMemo(
    () =>
      incoming
        .filter((e) => Boolean(e.sourceId))
        .map((e) => ({ edge: e, otherType: e.sourceType, otherId: e.sourceId })),
    [incoming],
  )

  const outgoingByType = useMemo(() => groupBy(outgoingSides, (s) => s.otherType), [outgoingSides])
  const incomingByType = useMemo(() => groupBy(incomingSides, (s) => s.otherType), [incomingSides])

  const outgoingTypes = Object.keys(outgoingByType).sort() as EntityType[]
  const incomingTypes = Object.keys(incomingByType).sort() as EntityType[]

  const isEmpty = outgoingSides.length === 0 && incomingSides.length === 0

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Relationships</Heading>
        {isEmpty ? (
          <EmptyState
            title="No typed relationships yet"
            description="Outgoing and incoming edges from the polymorphic edge graph appear here."
          />
        ) : (
          <Stack gap="md">
            {outgoingSides.length > 0 && (
              <Stack gap="sm">
                <Heading level={3}>Outgoing</Heading>
                <Stack gap="sm">
                  {outgoingTypes.map((t) => (
                    <NamedEdgeGroup
                      key={`out-${t}`}
                      heading={TYPE_LABELS[t]}
                      otherType={t}
                      sides={outgoingByType[t] ?? []}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
            {incomingSides.length > 0 && (
              <Stack gap="sm">
                <Heading level={3}>Incoming</Heading>
                <Stack gap="sm">
                  {incomingTypes.map((t) => (
                    <NamedEdgeGroup
                      key={`in-${t}`}
                      heading={`Referenced by ${TYPE_LABELS[t]}`}
                      otherType={t}
                      sides={incomingByType[t] ?? []}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

export default EntityRelationships
