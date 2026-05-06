/**
 * Pure-TS NPC Encounter domain module (#026).
 *
 * NPC encounters form a session-scoped event log: a row is appended each
 * time an NPC is encountered during a Session (from play-mode toolbar or
 * any future session-aware mutation). Mirrors the bond/SAN/clue-delivery
 * event tables; not a first-class graph entity.
 *
 * No DB or React imports — keep this module pure.
 */
import { z } from 'zod'

export const npcEncounterInputSchema = z.object({
  npcId: z.string().uuid('npcId must be a uuid'),
  sessionId: z.string().uuid('sessionId must be a uuid'),
  note: z.string().nullable().optional(),
})

export type NpcEncounterInput = z.infer<typeof npcEncounterInputSchema>
