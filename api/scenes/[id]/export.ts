import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../db/client'
import { serializeEntity } from '../../../domain/mdExport'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../../_lib/export'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) return res.status(400).json({ error: 'Missing id' })

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
