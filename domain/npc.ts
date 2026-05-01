/**
 * Pure-TS DG NPC domain module (#006).
 *
 * No DB, no React, no I/O. Consumed by both the Vercel Functions in `api/`
 * and the React app under `src/`. NPCs support either a full stat block
 * (matching PC stats; HP/WP derived via domain/pc.ts#deriveAttributes) or
 * a simplified block (just HP/WP) for cannon-fodder-tier NPCs per the
 * Handler's Guide.
 */
import { z } from 'zod'
import { pcStatsSchema, type PcStats } from './pc'

/** Status of an NPC in the campaign world. */
export const NPC_STATUSES = ['alive', 'dead', 'missing', 'turned'] as const
export type NpcStatus = (typeof NPC_STATUSES)[number]

// ─── Stat block ─────────────────────────────────────────────────────────────
//
// Two valid shapes:
//   - { kind: 'full', stats: PcStats }      — full DG RAW stats
//   - { kind: 'simplified', hp, wp }        — HP/WP only
//
// Discriminated by the `kind` field so Zod can narrow cleanly.

export const npcSimplifiedStatBlockSchema = z.object({
  kind: z.literal('simplified'),
  hp: z.number().int().min(0).max(99),
  wp: z.number().int().min(0).max(99),
})

export const npcFullStatBlockSchema = z.object({
  kind: z.literal('full'),
  stats: pcStatsSchema,
})

export const npcStatBlockSchema = z.discriminatedUnion('kind', [
  npcSimplifiedStatBlockSchema,
  npcFullStatBlockSchema,
])

export type NpcStatBlock =
  | { kind: 'simplified'; hp: number; wp: number }
  | { kind: 'full'; stats: PcStats }

// ─── Input schema ───────────────────────────────────────────────────────────

export type NpcInput = {
  name: string
  profession: string | null
  campaignId: string | null
  factionId: string | null
  locationId: string | null
  status: NpcStatus
  statBlock: NpcStatBlock
  /** RP hooks. */
  mannerisms: string | null
  voice: string | null
  secrets: string | null
  /** Current goal — what is this NPC working toward right now? */
  currentGoal: string | null
  description: string | null
}

export const npcInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  profession: z.string().min(1).nullable(),
  campaignId: z.string().min(1).nullable(),
  factionId: z.string().min(1).nullable(),
  locationId: z.string().min(1).nullable(),
  status: z.enum(NPC_STATUSES),
  statBlock: npcStatBlockSchema,
  mannerisms: z.string().nullable(),
  voice: z.string().nullable(),
  secrets: z.string().nullable(),
  currentGoal: z.string().nullable(),
  description: z.string().nullable(),
})

export type NpcInputParsed = z.infer<typeof npcInputSchema>
