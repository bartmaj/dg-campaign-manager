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

  const [location] = await db
    .select()
    .from(schema.locations)
    .where(eq(schema.locations.id, id))
    .limit(1)
  if (!location) return res.status(404).json({ error: 'Location not found' })

  const edgeCtx = await loadEdgeContext('location', id)
  const extraNames: Record<string, string> = {}
  if (location.parentLocationId) {
    const [p] = await db
      .select({ id: schema.locations.id, name: schema.locations.name })
      .from(schema.locations)
      .where(eq(schema.locations.id, location.parentLocationId))
      .limit(1)
    if (p) extraNames[p.id] = p.name
  }

  const md = serializeEntity({
    kind: 'location',
    location: {
      id: location.id,
      parentLocationId: location.parentLocationId,
      name: location.name,
      description: location.description,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    incomingEdges: toExportEdges(edgeCtx.incoming),
    entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
  })

  return sendMarkdown(res, md, exportFilename('location', location.name))
}
