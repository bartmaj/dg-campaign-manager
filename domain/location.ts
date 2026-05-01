/**
 * Pure-TS Location domain module (#008 baseline).
 *
 * Baseline shape only: name, optional description, optional parent location.
 * Reverse-ref panels (NPCs / items here) land in M2.2A.
 */
import { z } from 'zod'

export type LocationInput = {
  name: string
  description: string | null
  parentLocationId: string | null
  campaignId: string | null
}

export const locationInputSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().nullable(),
  parentLocationId: z.string().min(1).nullable(),
  campaignId: z.string().min(1).nullable(),
})

export type LocationInputParsed = z.infer<typeof locationInputSchema>
