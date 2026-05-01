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

  const [scenario] = await db
    .select()
    .from(schema.scenarios)
    .where(eq(schema.scenarios.id, id))
    .limit(1)
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' })

  const edgeCtx = await loadEdgeContext('scenario', id)

  const md = serializeEntity({
    kind: 'scenario',
    scenario: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: edgeCtx.entityNameById,
  })

  return sendMarkdown(res, md, exportFilename('scenario', scenario.name))
}
