import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { factionInputSchema } from '../../domain/faction'

/**
 * GET  /api/factions — list factions (most recently updated first)
 * POST /api/factions — create a faction
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.factions)
      .orderBy(desc(schema.factions.updatedAt))
      .limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = factionInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid faction input', issues: parsed.error.issues })
    }
    const input = parsed.data

    const [row] = await db
      .insert(schema.factions)
      .values({
        campaignId: input.campaignId,
        name: input.name,
        description: input.description,
        agenda: input.agenda,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
