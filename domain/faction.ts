/**
 * Pure-TS Faction domain module (#008 baseline).
 *
 * Baseline shape only: name, optional description, optional agenda. Member
 * surfacing arrives via polymorphic edges in M2.2A; the full status timeline
 * is #020.
 */
import { z } from 'zod'

export type FactionInput = {
  name: string
  description: string | null
  agenda: string | null
  campaignId: string | null
}

export const factionInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().nullable(),
  agenda: z.string().nullable(),
  campaignId: z.string().min(1).nullable(),
})

export type FactionInputParsed = z.infer<typeof factionInputSchema>
