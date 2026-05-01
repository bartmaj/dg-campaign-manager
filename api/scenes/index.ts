import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { sceneInputSchema } from '../../domain/scene'

/**
 * GET  /api/scenes?scenarioId= — list scenes (most recently updated first).
 *       If `scenarioId` is supplied, scenes are filtered to that scenario
 *       and sorted by orderIndex ascending.
 * POST /api/scenes — create a scene; requires scenarioId.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const scenarioIdParam = req.query.scenarioId
    const scenarioId = Array.isArray(scenarioIdParam) ? scenarioIdParam[0] : scenarioIdParam
    if (scenarioId) {
      const rows = await db
        .select()
        .from(schema.scenes)
        .where(eq(schema.scenes.scenarioId, scenarioId))
        .orderBy(asc(schema.scenes.orderIndex))
      return res.status(200).json(rows)
    }
    const rows = await db
      .select()
      .from(schema.scenes)
      .orderBy(desc(schema.scenes.updatedAt))
      .limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = sceneInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid scene input', issues: parsed.error.issues })
    }
    const input = parsed.data
    const [row] = await db
      .insert(schema.scenes)
      .values({
        scenarioId: input.scenarioId,
        name: input.name,
        description: input.description,
        orderIndex: input.orderIndex,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
