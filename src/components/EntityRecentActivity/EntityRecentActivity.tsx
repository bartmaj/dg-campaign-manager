// EntityRecentActivity — generic "sessions where this entity was active"
// card. Server-side, the involves-filter unions edge endpoints,
// bond_damage_events and san_change_events; here we just render the
// sorted list. Composes design-system primitives only.
import { useMemo } from 'react'
import { Link } from 'react-router'
import type { EntityType } from '../../../db/schema'
import type { SessionRow } from '../../api/sessions'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Heading from '../ui/Heading'
import Stack from '../ui/Stack'
import { useSessionsInvolving } from '../../hooks/useSessions'

type Props = {
  entityType: EntityType
  entityId: string
}

function dateKey(row: SessionRow): number | null {
  const v = row.realWorldDate
  if (!v) return null
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : t
}

/**
 * Sort: most recent realWorldDate first; nulls last (planned but
 * undated sessions still surface, just at the bottom). Stable for ties.
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

function EntityRecentActivity({ entityType, entityId }: Props) {
  const { data: sessions = [] } = useSessionsInvolving(entityType, entityId)
  const sorted = useMemo(() => sortMostRecent(sessions).slice(0, 10), [sessions])

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Recent activity</Heading>
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

export default EntityRecentActivity
