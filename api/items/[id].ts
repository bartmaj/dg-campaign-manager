import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'

/**
 * GET /api/items/:id — fetch a single item by id.
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

  const [row] = await db.select().from(schema.items).where(eq(schema.items.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Item not found' })
  }
  return res.status(200).json(row)
}
