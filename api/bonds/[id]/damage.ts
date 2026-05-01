import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq, sql } from 'drizzle-orm'
import { db, schema } from '../../../db/client'
import { applyDamage, bondDamageInputSchema } from '../../../domain/bonds'

/**
 * POST /api/bonds/:id/damage — record a damage/repair event and update the
 * bond's `currentScore` atomically. Both writes run inside a libSQL
 * transaction so a failure in either rolls back the other.
 *
 * Returns: { bond: Bond, event: BondDamageEvent }.
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

  const parsed = bondDamageInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid damage input', issues: parsed.error.issues })
  }
  const input = parsed.data

  try {
    const result = await db.transaction(async (tx) => {
      const [bond] = await tx.select().from(schema.bonds).where(eq(schema.bonds.id, id)).limit(1)
      if (!bond) return null

      const newScore = applyDamage(bond.currentScore, input.delta)

      const [event] = await tx
        .insert(schema.bondDamageEvents)
        .values({
          bondId: id,
          delta: input.delta,
          reason: input.reason ?? null,
          sessionId: input.sessionId ?? null,
        })
        .returning()

      const [updated] = await tx
        .update(schema.bonds)
        .set({ currentScore: newScore, updatedAt: sql`(unixepoch())` })
        .where(eq(schema.bonds.id, id))
        .returning()

      return { bond: updated, event }
    })

    if (!result) {
      return res.status(404).json({ error: 'Bond not found' })
    }
    return res.status(201).json(result)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
