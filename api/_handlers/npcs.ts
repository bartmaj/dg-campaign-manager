import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, desc, eq, like, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { serializeEntity } from '../../domain/mdExport'
import type { NpcStatus } from '../../domain/npc'
import { NPC_STATUSES, npcInputSchema } from '../../domain/npc'
import { deriveAttributes } from '../../domain/pc'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function npcsList(req: VercelRequest, res: VercelResponse) {
  const factionId = singleParam(req.query.factionId as string | string[] | undefined)
  const locationId = singleParam(req.query.locationId as string | string[] | undefined)
  const statusRaw = singleParam(req.query.status as string | string[] | undefined)
  const q = singleParam(req.query.q as string | string[] | undefined)

  const conditions: SQL[] = []
  if (factionId) conditions.push(eq(schema.npcs.factionId, factionId))
  if (locationId) conditions.push(eq(schema.npcs.locationId, locationId))
  if (statusRaw && (NPC_STATUSES as readonly string[]).includes(statusRaw)) {
    conditions.push(eq(schema.npcs.status, statusRaw as NpcStatus))
  }
  if (q && q.trim().length > 0) {
    conditions.push(like(schema.npcs.name, `%${q.trim()}%`))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const rows = await db
    .select()
    .from(schema.npcs)
    .where(where)
    .orderBy(desc(schema.npcs.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function npcsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = npcInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid NPC input', issues: parsed.error.issues })
  }
  const input = parsed.data

  let str: number | null = null
  let con: number | null = null
  let dex: number | null = null
  let intelligence: number | null = null
  let pow: number | null = null
  let cha: number | null = null
  let hp: number | null
  let wp: number | null

  if (input.statBlock.kind === 'full') {
    const s = input.statBlock.stats
    const derived = deriveAttributes(s)
    str = s.str
    con = s.con
    dex = s.dex
    intelligence = s.intelligence
    pow = s.pow
    cha = s.cha
    hp = derived.hp
    wp = derived.wp
  } else {
    hp = input.statBlock.hp
    wp = input.statBlock.wp
  }

  const [row] = await db
    .insert(schema.npcs)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      profession: input.profession,
      factionId: input.factionId,
      locationId: input.locationId,
      status: input.status,
      str,
      con,
      dex,
      intelligence,
      pow,
      cha,
      hp,
      wp,
      mannerisms: input.mannerisms,
      voice: input.voice,
      secrets: input.secrets,
      currentGoal: input.currentGoal,
    })
    .returning()
  return res.status(201).json(row)
}

export async function npcGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.npcs).where(eq(schema.npcs.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'NPC not found' })
  }
  return res.status(200).json(row)
}

export async function npcExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [npc] = await db.select().from(schema.npcs).where(eq(schema.npcs.id, id)).limit(1)
  if (!npc) return res.status(404).json({ error: 'NPC not found' })

  const edgeCtx = await loadEdgeContext('npc', id)

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
