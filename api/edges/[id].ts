import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'

/**
 * GET    /api/edges/:id — fetch a single edge by id.
 * DELETE /api/edges/:id — remove an edge by id.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) {
    return res.status(400).json({ error: 'Missing id' })
  }

  if (req.method === 'GET') {
    const [row] = await db.select().from(schema.edges).where(eq(schema.edges.id, id)).limit(1)
    if (!row) {
      return res.status(404).json({ error: 'Edge not found' })
    }
    return res.status(200).json(row)
  }

  if (req.method === 'DELETE') {
    const [row] = await db.delete(schema.edges).where(eq(schema.edges.id, id)).returning()
    if (!row) {
      return res.status(404).json({ error: 'Edge not found' })
    }
    return res.status(200).json(row)
  }

  res.setHeader('Allow', 'GET, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
