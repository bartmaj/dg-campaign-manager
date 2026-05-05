/**
 * Pure-TS Faction Status domain module (#020).
 *
 * Status events form a chronological timeline attached to a faction. They
 * are NOT first-class graph entities — see ENTITY_TYPES / EDGE_RULES — they
 * are a child collection (mirrors `bond_damage_events` / `san_change_events`).
 *
 * Domain logic is intentionally minimal: input validation and a stable
 * comparator. The API layer handles persistence; the UI handles rendering.
 */
import { z } from 'zod'

export const factionStatusEventInputSchema = z.object({
  factionId: z.string().uuid('factionId must be a uuid'),
  note: z.string().min(1, 'note is required'),
  occurredAt: z.coerce.date(),
  sessionId: z.string().uuid().optional(),
})

export type FactionStatusEventInput = z.infer<typeof factionStatusEventInputSchema>

type Comparable = {
  occurredAt: Date | string | number
  createdAt: Date | string | number
}

function toMillis(v: Date | string | number): number {
  if (v instanceof Date) return v.getTime()
  if (typeof v === 'number') return v
  const t = Date.parse(v)
  return Number.isNaN(t) ? 0 : t
}

/**
 * Ascending comparator by `occurredAt`, with `createdAt` as a stable
 * tiebreaker so two events recorded for the same in-game date keep a
 * deterministic order on the timeline.
 */
export function compareByOccurredAt(a: Comparable, b: Comparable): number {
  const ao = toMillis(a.occurredAt)
  const bo = toMillis(b.occurredAt)
  if (ao !== bo) return ao - bo
  return toMillis(a.createdAt) - toMillis(b.createdAt)
}
