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

  const [clue] = await db.select().from(schema.clues).where(eq(schema.clues.id, id)).limit(1)
  if (!clue) return res.status(404).json({ error: 'Clue not found' })

  const edgeCtx = await loadEdgeContext('clue', id)
  const extraNames: Record<string, string> = {}
  if (clue.originScenarioId) {
    const [s] = await db
      .select({ id: schema.scenarios.id, name: schema.scenarios.name })
      .from(schema.scenarios)
      .where(eq(schema.scenarios.id, clue.originScenarioId))
      .limit(1)
    if (s) extraNames[s.id] = s.name
  }

  const md = serializeEntity({
    kind: 'clue',
    clue: {
      id: clue.id,
      name: clue.name,
      description: clue.description,
      originScenarioId: clue.originScenarioId,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
  })

  return sendMarkdown(res, md, exportFilename('clue', clue.name))
}
