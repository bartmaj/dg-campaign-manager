/**
 * Pure-TS Scenario domain module (#014).
 *
 * Baseline shape: name, optional description, optional campaign. Outgoing
 * relationships (e.g., `session→scenario runs_through`) live in the
 * polymorphic `edges` table per ADR-002.
 */
import { z } from 'zod'

export type ScenarioInput = {
  name: string
  description: string | null
  campaignId: string | null
}

export const scenarioInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().nullable(),
  campaignId: z.string().min(1).nullable(),
})

export type ScenarioInputParsed = z.infer<typeof scenarioInputSchema>
