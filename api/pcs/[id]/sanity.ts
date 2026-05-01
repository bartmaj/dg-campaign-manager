import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq, sql } from 'drizzle-orm'
import { db, schema } from '../../../db/client'
import {
  applySanityChange,
  detectCrossedThresholds,
  sanChangeInputSchema,
} from '../../../domain/sanity'

/**
 * POST /api/pcs/:id/sanity — record a SAN loss/gain event and update the
 * PC's `sanityCurrent` atomically. Both writes run inside a libSQL
 * transaction so a failure in either rolls back the other.
 *
 * The API computes which breaking-point thresholds the change crossed
 * (using the PC's stored `breakingPoints`) and persists that on the event.
 *
 * Returns: { pc, event, crossedThresholds }.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) {
    return res.status(400).json({ error: 'Missing id' })
  }

  const parsed = sanChangeInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid sanity input', issues: parsed.error.issues })
  }
  const input = parsed.data

  try {
    const result = await db.transaction(async (tx) => {
      const [pc] = await tx.select().from(schema.pcs).where(eq(schema.pcs.id, id)).limit(1)
      if (!pc) return null

      const prevSan = pc.sanityCurrent ?? pc.sanMax
      const ceiling = pc.sanMax > 0 ? pc.sanMax : Number.POSITIVE_INFINITY
      const nextSan = applySanityChange(prevSan, input.delta, { ceiling })
      const thresholds = pc.breakingPoints ?? []
      const crossed = detectCrossedThresholds(prevSan, nextSan, thresholds)

      const [event] = await tx
        .insert(schema.sanChangeEvents)
        .values({
          pcId: id,
          delta: input.delta,
          source: input.source,
          sessionId: input.sessionId ?? null,
          crossedThresholds: crossed,
        })
        .returning()

      const [updated] = await tx
        .update(schema.pcs)
        .set({ sanityCurrent: nextSan, updatedAt: sql`(unixepoch())` })
        .where(eq(schema.pcs.id, id))
        .returning()

      return { pc: updated, event, crossedThresholds: crossed }
    })

    if (!result) {
      return res.status(404).json({ error: 'PC not found' })
    }
    return res.status(201).json(result)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
