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

  const [faction] = await db
    .select()
    .from(schema.factions)
    .where(eq(schema.factions.id, id))
    .limit(1)
  if (!faction) return res.status(404).json({ error: 'Faction not found' })

  const edgeCtx = await loadEdgeContext('faction', id)

  const md = serializeEntity({
    kind: 'faction',
    faction: {
      id: faction.id,
      name: faction.name,
      description: faction.description,
      agenda: faction.agenda,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    incomingEdges: toExportEdges(edgeCtx.incoming),
    entityNameById: edgeCtx.entityNameById,
  })

  return sendMarkdown(res, md, exportFilename('faction', faction.name))
}
