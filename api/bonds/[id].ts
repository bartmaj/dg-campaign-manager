import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'

/**
 * GET    /api/bonds/:id — fetch a bond plus its damage events:
 *                         { bond, events: BondDamageEvent[] }.
 * DELETE /api/bonds/:id — remove a bond. Damage events cascade via FK.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) {
    return res.status(400).json({ error: 'Missing id' })
  }

  if (req.method === 'GET') {
    const [bond] = await db.select().from(schema.bonds).where(eq(schema.bonds.id, id)).limit(1)
    if (!bond) {
      return res.status(404).json({ error: 'Bond not found' })
    }
    const events = await db
      .select()
      .from(schema.bondDamageEvents)
      .where(eq(schema.bondDamageEvents.bondId, id))
      .orderBy(asc(schema.bondDamageEvents.appliedAt))
    return res.status(200).json({ bond, events })
  }

  if (req.method === 'DELETE') {
    const [row] = await db.delete(schema.bonds).where(eq(schema.bonds.id, id)).returning()
    if (!row) {
      return res.status(404).json({ error: 'Bond not found' })
    }
    return res.status(200).json(row)
  }

  res.setHeader('Allow', 'GET, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
