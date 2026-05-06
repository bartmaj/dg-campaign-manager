/**
 * Pure-TS Clue Delivery domain module (#025).
 *
 * Clue delivery is recorded as an append-only event log:
 *   - `kind: 'delivered'` — the clue was handed to one or more PCs in a
 *     session. `pcIds` lists the recipients.
 *   - `kind: 'undelivered'` — corrective event reversing a prior delivery
 *     for that same session. Append-only contract: we never mutate or
 *     delete past events.
 *
 * `computeDeliveryState` folds an ordered event list into the *current*
 * state — a per-session map of recipient PCs — so the UI can answer
 * "is this clue delivered, and to whom?" in O(events).
 *
 * No DB or React imports — keep this module pure.
 */
import { z } from 'zod'

export const clueDeliveryInputSchema = z
  .object({
    clueId: z.string().uuid('clueId must be a uuid'),
    sessionId: z.string().uuid('sessionId must be a uuid'),
    kind: z.enum(['delivered', 'undelivered']),
    pcIds: z.array(z.string().min(1)),
    note: z.string().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind === 'delivered' && val.pcIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pcIds'],
        message: 'delivered events require at least one recipient PC',
      })
    }
  })

export type ClueDeliveryInput = z.infer<typeof clueDeliveryInputSchema>

export type DeliveryEvent = {
  id?: string
  clueId?: string
  sessionId: string
  kind: 'delivered' | 'undelivered'
  pcIds: string[]
  note?: string | null
  appliedAt: Date | string | number
}

export type CurrentDelivery = {
  pcIds: string[]
  appliedAt: Date
}

export type DeliveryState = {
  delivered: Map<string, CurrentDelivery>
  isDelivered: boolean
  lastEventAt: Date | null
}

function toDate(v: Date | string | number): Date {
  if (v instanceof Date) return v
  if (typeof v === 'number') return new Date(v)
  const t = Date.parse(v)
  return new Date(Number.isNaN(t) ? 0 : t)
}

/**
 * Fold an ordered event history into the current delivery state.
 *
 * Each `delivered` event sets (or replaces) the entry for its sessionId
 * with the listed recipient PCs. Each `undelivered` event removes the
 * entry for its sessionId. The input is treated as the canonical
 * history; the returned map is the **current** state.
 *
 * Events are processed in ascending `appliedAt` order — callers don't
 * need to pre-sort.
 */
export function computeDeliveryState(events: ReadonlyArray<DeliveryEvent>): DeliveryState {
  const sorted = [...events].sort(
    (a, b) => toDate(a.appliedAt).getTime() - toDate(b.appliedAt).getTime(),
  )
  const delivered = new Map<string, CurrentDelivery>()
  let lastEventAt: Date | null = null

  for (const e of sorted) {
    const at = toDate(e.appliedAt)
    lastEventAt = at
    if (e.kind === 'delivered') {
      delivered.set(e.sessionId, { pcIds: [...e.pcIds], appliedAt: at })
    } else {
      delivered.delete(e.sessionId)
    }
  }

  return {
    delivered,
    isDelivered: delivered.size > 0,
    lastEventAt,
  }
}

/** Convenience: did the given PC ever currently have this clue delivered? */
export function isClueDeliveredToPc(events: ReadonlyArray<DeliveryEvent>, pcId: string): boolean {
  const state = computeDeliveryState(events)
  for (const cur of state.delivered.values()) {
    if (cur.pcIds.includes(pcId)) return true
  }
  return false
}
