/**
 * Pure-TS Bonds domain module (#011).
 *
 * Bonds in Delta Green start at the bonded character's CHA. Damage reduces
 * the current value; max stays put under normal play. We expose:
 *   - applyDamage: clamp-aware delta application (negative = damage,
 *     positive = repair).
 *   - summarizeHistory: aggregate damage / repair / last change for UI.
 *   - bondInputSchema, bondDamageInputSchema: Zod validators for the API.
 *
 * No DB or React imports — keep this module pure.
 */
import { z } from 'zod'

export type ApplyDamageOpts = {
  floor?: number
  ceiling?: number
}

/**
 * Apply a signed delta to a Bond's current score, clamping to the
 * `[floor, ceiling]` interval. Defaults: floor 0, ceiling Infinity (i.e.
 * repair beyond original max is allowed unless the caller passes one).
 */
export function applyDamage(
  currentScore: number,
  delta: number,
  opts: ApplyDamageOpts = {},
): number {
  const floor = opts.floor ?? 0
  const ceiling = opts.ceiling ?? Number.POSITIVE_INFINITY
  const next = currentScore + delta
  if (next < floor) return floor
  if (next > ceiling) return ceiling
  return next
}

export type HistoryEntry = {
  delta: number
  appliedAt: Date
}

export type HistorySummary = {
  totalDamage: number
  totalRepair: number
  lastChangeAt: Date | null
}

/**
 * Summarize a chronological list of damage events.
 * `totalDamage` is reported as a positive number (sum of |negative deltas|).
 */
export function summarizeHistory(events: ReadonlyArray<HistoryEntry>): HistorySummary {
  let totalDamage = 0
  let totalRepair = 0
  let lastChangeAt: Date | null = null
  for (const e of events) {
    if (e.delta < 0) totalDamage += -e.delta
    else if (e.delta > 0) totalRepair += e.delta
    if (lastChangeAt === null || e.appliedAt > lastChangeAt) {
      lastChangeAt = e.appliedAt
    }
  }
  return { totalDamage, totalRepair, lastChangeAt }
}

// ─── Zod schemas ───────────────────────────────────────────────────────────

export const BOND_TARGET_TYPES = ['npc', 'pc'] as const
export type BondTargetType = (typeof BOND_TARGET_TYPES)[number]

export const bondInputSchema = z.object({
  pcId: z.string().min(1, 'pcId is required'),
  name: z.string().min(1, 'name is required'),
  targetType: z.enum(BOND_TARGET_TYPES),
  targetId: z.string().min(1, 'targetId is required'),
  maxScore: z.number().int().min(0),
  // If omitted, the API defaults to maxScore.
  currentScore: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
})

export type BondInput = z.infer<typeof bondInputSchema>

export const bondDamageInputSchema = z.object({
  delta: z.number().int(),
  reason: z.string().nullable().optional(),
  sessionId: z.string().min(1).nullable().optional(),
})

export type BondDamageInput = z.infer<typeof bondDamageInputSchema>
