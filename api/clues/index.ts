import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { clueInputSchema } from '../../domain/clue'

/**
 * GET  /api/clues — list clues (most recently updated first)
 * POST /api/clues — create a clue
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.clues)
      .orderBy(desc(schema.clues.updatedAt))
      .limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = clueInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid clue input', issues: parsed.error.issues })
    }
    const input = parsed.data

    const [row] = await db
      .insert(schema.clues)
      .values({
        campaignId: input.campaignId,
        name: input.name,
        description: input.description,
        originScenarioId: input.originScenarioId,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
