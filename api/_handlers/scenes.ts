import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { serializeEntity } from '../../domain/mdExport'
import { sceneInputSchema } from '../../domain/scene'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

export async function scenesList(req: VercelRequest, res: VercelResponse) {
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

export async function scenesCreate(req: VercelRequest, res: VercelResponse) {
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

export async function sceneGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.scenes).where(eq(schema.scenes.id, id)).limit(1)
  if (!row) return res.status(404).json({ error: 'Scene not found' })
  return res.status(200).json(row)
}

export async function sceneExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [scene] = await db.select().from(schema.scenes).where(eq(schema.scenes.id, id)).limit(1)
  if (!scene) return res.status(404).json({ error: 'Scene not found' })

  const edgeCtx = await loadEdgeContext('scene', id)
  const extraNames: Record<string, string> = {}
  if (scene.scenarioId) {
    const [s] = await db
      .select({ id: schema.scenarios.id, name: schema.scenarios.name })
      .from(schema.scenarios)
      .where(eq(schema.scenarios.id, scene.scenarioId))
      .limit(1)
    if (s) extraNames[s.id] = s.name
  }

  const md = serializeEntity({
    kind: 'scene',
    scene: {
      id: scene.id,
      scenarioId: scene.scenarioId,
      name: scene.name,
      description: scene.description,
      orderIndex: scene.orderIndex,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    incomingEdges: toExportEdges(edgeCtx.incoming),
    entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
  })

  return sendMarkdown(res, md, exportFilename('scene', scene.name))
}
