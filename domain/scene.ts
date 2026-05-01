/**
 * Pure-TS Scene domain module (#014).
 *
 * Baseline shape: a scene belongs to a scenario; carries name, optional
 * description, and an integer order index used to sort scenes within a
 * scenario. Outgoing typed relationships (delivered_in clues, etc.) live
 * in the polymorphic `edges` table per ADR-002.
 */
import { z } from 'zod'

export type SceneInput = {
  scenarioId: string
  name: string
  description: string | null
  orderIndex: number
}

export const sceneInputSchema = z.object({
  scenarioId: z.string().min(1, 'scenarioId is required'),
  name: z.string().min(1, 'name is required'),
  description: z.string().nullable(),
  orderIndex: z.number().int().nonnegative().default(0),
})

export type SceneInputParsed = z.infer<typeof sceneInputSchema>
