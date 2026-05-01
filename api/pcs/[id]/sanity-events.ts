import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../db/client'

/**
 * GET /api/pcs/:id/sanity-events — list SAN change events for a PC,
 * newest first.
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

  const events = await db
    .select()
    .from(schema.sanChangeEvents)
    .where(eq(schema.sanChangeEvents.pcId, id))
    .orderBy(desc(schema.sanChangeEvents.appliedAt))
    .limit(500)

  return res.status(200).json(events)
}
