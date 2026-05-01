import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../db/client'
import { serializeEntity } from '../../../domain/mdExport'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../../_lib/export'
import type { NpcStatus } from '../../../domain/npc'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const [npc] = await db.select().from(schema.npcs).where(eq(schema.npcs.id, id)).limit(1)
  if (!npc) return res.status(404).json({ error: 'NPC not found' })

  const edgeCtx = await loadEdgeContext('npc', id)

  // The faction/location refs aren't carried as edges in the DB (they
  // live on dedicated FK columns), so seed the name map from those too
  // when we have the related rows.
  const extraNames: Record<string, string> = {}
  if (npc.factionId) {
    const [f] = await db
      .select({ id: schema.factions.id, name: schema.factions.name })
      .from(schema.factions)
      .where(eq(schema.factions.id, npc.factionId))
      .limit(1)
    if (f) extraNames[f.id] = f.name
  }
  if (npc.locationId) {
    const [l] = await db
      .select({ id: schema.locations.id, name: schema.locations.name })
      .from(schema.locations)
      .where(eq(schema.locations.id, npc.locationId))
      .limit(1)
    if (l) extraNames[l.id] = l.name
  }

  const md = serializeEntity({
    kind: 'npc',
    npc: {
      id: npc.id,
      name: npc.name,
      description: npc.description,
      factionId: npc.factionId,
      profession: npc.profession,
      str: npc.str,
      con: npc.con,
      dex: npc.dex,
      intelligence: npc.intelligence,
      pow: npc.pow,
      cha: npc.cha,
      hp: npc.hp,
      wp: npc.wp,
      mannerisms: npc.mannerisms,
      voice: npc.voice,
      secrets: npc.secrets,
      status: npc.status as NpcStatus,
      locationId: npc.locationId,
      currentGoal: npc.currentGoal,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    incomingEdges: toExportEdges(edgeCtx.incoming),
    entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
  })

  return sendMarkdown(res, md, exportFilename('npc', npc.name))
}
