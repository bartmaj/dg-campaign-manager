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

  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, id))
    .limit(1)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const edgeCtx = await loadEdgeContext('session', id)

  const md = serializeEntity({
    kind: 'session',
    session: {
      id: session.id,
      name: session.name,
      description: session.description,
      inGameDate: session.inGameDate,
      inGameDateEnd: session.inGameDateEnd,
      realWorldDate:
        session.realWorldDate instanceof Date
          ? session.realWorldDate.toISOString()
          : (session.realWorldDate ?? null),
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: edgeCtx.entityNameById,
  })

  return sendMarkdown(res, md, exportFilename('session', session.name))
}
