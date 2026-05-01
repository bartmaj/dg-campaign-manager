/**
 * Pure-TS Sanity domain module (#012).
 *
 * Sanity in Delta Green starts at POW × 5 (sanMax) and is reduced by
 * exposure to the unnatural. The DG Handler's Guide treats certain SAN
 * values as "breaking points" — most commonly POW × 4, × 3, × 2, POW —
 * descending past which triggers Disordered/Adapted outcomes. We model
 * breaking points generically as a list of integer SAN thresholds; the
 * domain detects which thresholds were *crossed* by a given change.
 *
 * Functions:
 *   - applySanityChange: clamp-aware delta application.
 *   - detectCrossedThresholds: returns thresholds the change crossed.
 *   - summarizeSanHistory: aggregate totals + last change for UI.
 *   - sanChangeInputSchema: Zod validator for the API.
 *
 * No DB or React imports — keep this module pure.
 */
import { z } from 'zod'

export type ApplySanityOpts = {
  floor?: number
  ceiling?: number
}

/**
 * Apply a signed delta to a SAN value, clamping to `[floor, ceiling]`.
 * Defaults: floor 0, ceiling Infinity.
 */
export function applySanityChange(
  currentSan: number,
  delta: number,
  opts: ApplySanityOpts = {},
): number {
  const floor = opts.floor ?? 0
  const ceiling = opts.ceiling ?? Number.POSITIVE_INFINITY
  const next = currentSan + delta
  if (next < floor) return floor
  if (next > ceiling) return ceiling
  return next
}

/**
 * Return the thresholds crossed by a change from `prevSan` to `nextSan`.
 *
 * Convention (chosen so that "sitting AT a threshold and dropping below"
 * counts as a crossing — the PC has *left* the threshold):
 *   - Downward change (nextSan < prevSan): a threshold `t` is crossed iff
 *     `nextSan < t <= prevSan`. Examples (thresholds = [52, 39, 26, 13]):
 *       50 → 38 crosses 39.
 *       39 → 35 crosses 39 (we leave it).
 *       50 → 39 does NOT cross 39 (we landed on it from above; we have
 *         not descended through it yet).
 *       50 → 50 crosses nothing (no change).
 *   - Upward change (nextSan > prevSan): a threshold `t` is crossed iff
 *     `prevSan < t <= nextSan` — the symmetric rule for gaining SAN back
 *     up through a threshold (landing on it counts).
 *   - No change (nextSan === prevSan): never crosses anything.
 *
 * The returned thresholds preserve numeric order (descending for downward
 * changes, ascending for upward) — callers can render them in chronological
 * crossing order.
 */
export function detectCrossedThresholds(
  prevSan: number,
  nextSan: number,
  thresholds: ReadonlyArray<number>,
): number[] {
  if (nextSan === prevSan) return []
  if (nextSan < prevSan) {
    // Descending — order from highest to lowest (the order they're crossed).
    return thresholds
      .filter((t) => nextSan < t && t <= prevSan)
      .slice()
      .sort((a, b) => b - a)
  }
  // Ascending — order from lowest to highest (the order they're crossed).
  return thresholds
    .filter((t) => prevSan < t && t <= nextSan)
    .slice()
    .sort((a, b) => a - b)
}

export type SanHistoryEntry = {
  delta: number
  appliedAt: Date
  crossedThresholds: ReadonlyArray<number>
}

export type SanHistorySummary = {
  totalLoss: number
  totalGain: number
  totalCrossings: number
  lastChangeAt: Date | null
}

/**
 * Summarize a chronological list of SAN events.
 * `totalLoss` is reported as a positive number (sum of |negative deltas|).
 */
export function summarizeSanHistory(events: ReadonlyArray<SanHistoryEntry>): SanHistorySummary {
  let totalLoss = 0
  let totalGain = 0
  let totalCrossings = 0
  let lastChangeAt: Date | null = null
  for (const e of events) {
    if (e.delta < 0) totalLoss += -e.delta
    else if (e.delta > 0) totalGain += e.delta
    totalCrossings += e.crossedThresholds.length
    if (lastChangeAt === null || e.appliedAt > lastChangeAt) {
      lastChangeAt = e.appliedAt
    }
  }
  return { totalLoss, totalGain, totalCrossings, lastChangeAt }
}

// ─── Zod schemas ───────────────────────────────────────────────────────────

export const sanChangeInputSchema = z.object({
  delta: z.number().int(),
  source: z.string().min(1, 'source is required'),
  sessionId: z.string().min(1).nullable().optional(),
})

export type SanChangeInput = z.infer<typeof sanChangeInputSchema>
