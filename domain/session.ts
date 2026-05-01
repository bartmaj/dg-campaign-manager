/**
 * Pure-TS Session domain module (#013).
 *
 * Hybrid timeline per REQ-010: every session carries both an in-game date
 * (a range — start + optional end) and an optional real-world date. Two
 * comparators expose the dual-axis ordering used by the timeline UI.
 *
 * Outgoing typed relationships (`session→scenario` `runs_through`) live in
 * the polymorphic `edges` table per ADR-002. Per-session damage / SAN
 * surfacing comes in a follow-up issue.
 */
import { z } from 'zod'

export type SessionInput = {
  name: string
  description: string | null
  inGameDate: string | null
  inGameDateEnd: string | null
  realWorldDate: Date | null
  campaignId: string | null
}

/**
 * Accepts an ISO date string (YYYY-MM-DD or full ISO) and returns a Date.
 * Empty strings → null. Invalid dates produce a Zod error.
 */
const isoDateString = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), 'must be a valid ISO date string')

export const sessionInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().nullable(),
  inGameDate: isoDateString.nullable(),
  inGameDateEnd: isoDateString.nullable(),
  realWorldDate: z
    .union([z.date(), isoDateString])
    .nullable()
    .transform((v) => (v === null ? null : v instanceof Date ? v : new Date(v))),
  campaignId: z.string().min(1).nullable(),
})

export type SessionInputParsed = z.infer<typeof sessionInputSchema>

type WithInGame = { inGameDate: string | null }
type WithRealWorld = { realWorldDate: Date | string | null }

function inGameTimeOrNull(s: WithInGame): number | null {
  if (s.inGameDate === null) return null
  const t = Date.parse(s.inGameDate)
  return Number.isNaN(t) ? null : t
}

function realWorldTimeOrNull(s: WithRealWorld): number | null {
  if (s.realWorldDate === null) return null
  const v = s.realWorldDate
  if (v instanceof Date) return v.getTime()
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : t
}

/**
 * Comparator: ascending by `inGameDate` start. Sessions with a null
 * in-game date sort to the end.
 */
export function compareByInGame<T extends WithInGame>(a: T, b: T): number {
  const ta = inGameTimeOrNull(a)
  const tb = inGameTimeOrNull(b)
  if (ta === null && tb === null) return 0
  if (ta === null) return 1
  if (tb === null) return -1
  return ta - tb
}

/**
 * Comparator: ascending by `realWorldDate`. Sessions with a null IRL
 * date sort to the end.
 */
export function compareByRealWorld<T extends WithRealWorld>(a: T, b: T): number {
  const ta = realWorldTimeOrNull(a)
  const tb = realWorldTimeOrNull(b)
  if (ta === null && tb === null) return 0
  if (ta === null) return 1
  if (tb === null) return -1
  return ta - tb
}
