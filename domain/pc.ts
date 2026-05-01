/**
 * Pure-TS DG RAW PC domain module (ADR-005).
 *
 * No DB, no React, no I/O. Consumed by both the Vercel Functions in `api/`
 * and the React app under `src/`. Derived attribute formulas follow the
 * Delta Green Handler's Guide.
 */
import { z } from 'zod'

/** Inclusive lower bound for a stat at character creation. */
export const STAT_MIN = 1
/** Inclusive upper bound for a stat at character creation (RAW conservative). */
export const STAT_MAX = 18

export type PcStats = {
  str: number
  con: number
  dex: number
  /** Spelled out to avoid the TS-reserved-feeling `int` keyword. */
  intelligence: number
  pow: number
  cha: number
}

export type PcDerivedAttributes = {
  /** Hit Points: round((STR + CON) / 2). */
  hp: number
  /** Willpower Points: round((POW + CHA) / 2). */
  wp: number
  /** Breaking Point: SAN - POW (initial; before SAN loss). */
  bp: number
  /** Sanity max: POW * 5. Capped at 99 once Bonds break (M2 mechanic). */
  sanMax: number
}

export type PcSkill = {
  name: string
  rating: number
}

export type PcInput = {
  name: string
  profession: string | null
  campaignId: string | null
  stats: PcStats
  skills: PcSkill[]
  motivations: string[]
  backstoryHooks: string
}

const STAT_FIELDS: ReadonlyArray<keyof PcStats> = [
  'str',
  'con',
  'dex',
  'intelligence',
  'pow',
  'cha',
]

function assertStatsInRange(stats: PcStats): void {
  for (const key of STAT_FIELDS) {
    const value = stats[key]
    if (!Number.isInteger(value) || value < STAT_MIN || value > STAT_MAX) {
      throw new RangeError(
        `Stat ${key} must be an integer between ${STAT_MIN} and ${STAT_MAX}; got ${value}`,
      )
    }
  }
}

/**
 * Compute derived attributes from base stats per DG RAW.
 * Throws RangeError if any stat is out of range.
 */
export function deriveAttributes(stats: PcStats): PcDerivedAttributes {
  assertStatsInRange(stats)
  const hp = Math.round((stats.str + stats.con) / 2)
  const wp = Math.round((stats.pow + stats.cha) / 2)
  const sanMax = stats.pow * 5
  // BP = SAN - POW. At creation SAN = sanMax, so BP = (POW * 5) - POW = POW * 4.
  const bp = sanMax - stats.pow
  return { hp, wp, bp, sanMax }
}

// ─── Zod schemas ────────────────────────────────────────────────────────────

const statSchema = z.number().int().min(STAT_MIN).max(STAT_MAX)

export const pcStatsSchema = z.object({
  str: statSchema,
  con: statSchema,
  dex: statSchema,
  intelligence: statSchema,
  pow: statSchema,
  cha: statSchema,
})

export const pcSkillSchema = z.object({
  name: z.string().min(1),
  rating: z.number().int().min(0).max(99),
})

export const pcInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  profession: z.string().min(1).nullable(),
  campaignId: z.string().min(1).nullable(),
  stats: pcStatsSchema,
  skills: z.array(pcSkillSchema),
  motivations: z.array(z.string().min(1)),
  backstoryHooks: z.string(),
})

export type PcInputParsed = z.infer<typeof pcInputSchema>
