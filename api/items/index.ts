import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { itemInputSchema } from '../../domain/item'

/**
 * GET  /api/items — list items (most recently updated first)
 * POST /api/items — create an item
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.items)
      .orderBy(desc(schema.items.updatedAt))
      .limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = itemInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid item input', issues: parsed.error.issues })
    }
    const input = parsed.data

    const [row] = await db
      .insert(schema.items)
      .values({
        campaignId: input.campaignId,
        name: input.name,
        description: input.description,
        history: input.history,
        ownerNpcId: input.ownerNpcId,
        locationId: input.locationId,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
