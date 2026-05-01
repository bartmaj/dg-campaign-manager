/**
 * Pure-TS Item domain module (#008 baseline).
 *
 * Baseline shape: name, optional description / history, optional foreign-key
 * refs to owner NPC and current location. The picker UX for those refs is a
 * follow-up; for now the form accepts raw ID strings.
 */
import { z } from 'zod'

export type ItemInput = {
  name: string
  description: string | null
  history: string | null
  ownerNpcId: string | null
  locationId: string | null
  campaignId: string | null
}

export const itemInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().nullable(),
  history: z.string().nullable(),
  ownerNpcId: z.string().min(1).nullable(),
  locationId: z.string().min(1).nullable(),
  campaignId: z.string().min(1).nullable(),
})

export type ItemInputParsed = z.infer<typeof itemInputSchema>
