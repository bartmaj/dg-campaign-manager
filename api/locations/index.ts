import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { locationInputSchema } from '../../domain/location'

/**
 * GET  /api/locations — list locations (most recently updated first)
 * POST /api/locations — create a location
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.locations)
      .orderBy(desc(schema.locations.updatedAt))
      .limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = locationInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid location input', issues: parsed.error.issues })
    }
    const input = parsed.data

    const [row] = await db
      .insert(schema.locations)
      .values({
        campaignId: input.campaignId,
        name: input.name,
        description: input.description,
        parentLocationId: input.parentLocationId,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
