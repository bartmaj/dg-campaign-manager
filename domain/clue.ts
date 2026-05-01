/**
 * Pure-TS Clue domain module (#010).
 *
 * Baseline shape: name, optional description, optional origin scenario,
 * optional campaign. Outgoing typed relationships (mentions / implicates /
 * points_to / delivered_in / prerequisite_of) live in the polymorphic
 * `edges` table per ADR-002. Delivery state ("delivered_in" mechanics)
 * lands in #025.
 */
import { z } from 'zod'

export type ClueInput = {
  name: string
  description: string | null
  originScenarioId: string | null
  campaignId: string | null
}

export const clueInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().nullable(),
  originScenarioId: z.string().min(1).nullable(),
  campaignId: z.string().min(1).nullable(),
})

export type ClueInputParsed = z.infer<typeof clueInputSchema>
