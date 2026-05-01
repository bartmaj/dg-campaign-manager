import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'

/**
 * GET /api/npcs/:id — fetch a single NPC by id.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) {
    return res.status(400).json({ error: 'Missing id' })
  }

  const [row] = await db.select().from(schema.npcs).where(eq(schema.npcs.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'NPC not found' })
  }
  return res.status(200).json(row)
}
