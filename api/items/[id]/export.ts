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

  const [item] = await db.select().from(schema.items).where(eq(schema.items.id, id)).limit(1)
  if (!item) return res.status(404).json({ error: 'Item not found' })

  const edgeCtx = await loadEdgeContext('item', id)
  const extraNames: Record<string, string> = {}
  if (item.ownerNpcId) {
    const [n] = await db
      .select({ id: schema.npcs.id, name: schema.npcs.name })
      .from(schema.npcs)
      .where(eq(schema.npcs.id, item.ownerNpcId))
      .limit(1)
    if (n) extraNames[n.id] = n.name
  }
  if (item.locationId) {
    const [l] = await db
      .select({ id: schema.locations.id, name: schema.locations.name })
      .from(schema.locations)
      .where(eq(schema.locations.id, item.locationId))
      .limit(1)
    if (l) extraNames[l.id] = l.name
  }

  const md = serializeEntity({
    kind: 'item',
    item: {
      id: item.id,
      name: item.name,
      description: item.description,
      history: item.history,
      ownerNpcId: item.ownerNpcId,
      locationId: item.locationId,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
  })

  return sendMarkdown(res, md, exportFilename('item', item.name))
}
