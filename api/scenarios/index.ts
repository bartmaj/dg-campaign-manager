import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { scenarioInputSchema } from '../../domain/scenario'

/**
 * GET  /api/scenarios — list scenarios (most recently updated first)
 * POST /api/scenarios — create a scenario. If `campaignId` is omitted, the
 *       handler falls back to the first existing campaign or auto-creates
 *       a "Default Campaign" so creation is unblocked before the
 *       multi-campaign UI lands (#023).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.scenarios)
      .orderBy(desc(schema.scenarios.updatedAt))
      .limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = scenarioInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid scenario input', issues: parsed.error.issues })
    }
    const input = parsed.data

    let campaignId = input.campaignId
    if (!campaignId) {
      const [existing] = await db
        .select()
        .from(schema.campaigns)
        .orderBy(asc(schema.campaigns.createdAt))
        .limit(1)
      if (existing) {
        campaignId = existing.id
      } else {
        const inserted = await db
          .insert(schema.campaigns)
          .values({ name: 'Default Campaign', description: null })
          .returning()
        const created = inserted[0]
        if (!created) {
          return res.status(500).json({ error: 'Failed to auto-create default campaign' })
        }
        campaignId = created.id
      }
    }

    const [row] = await db
      .insert(schema.scenarios)
      .values({
        campaignId,
        name: input.name,
        description: input.description,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
