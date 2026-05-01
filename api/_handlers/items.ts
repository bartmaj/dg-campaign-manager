import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, desc, eq, like, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { itemInputSchema } from '../../domain/item'
import { serializeEntity } from '../../domain/mdExport'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function itemsList(req: VercelRequest, res: VercelResponse) {
  const locationId = singleParam(req.query.locationId as string | string[] | undefined)
  const ownerNpcId = singleParam(req.query.ownerNpcId as string | string[] | undefined)
  const q = singleParam(req.query.q as string | string[] | undefined)

  const conditions: SQL[] = []
  if (locationId) conditions.push(eq(schema.items.locationId, locationId))
  if (ownerNpcId) conditions.push(eq(schema.items.ownerNpcId, ownerNpcId))
  if (q && q.trim().length > 0) conditions.push(like(schema.items.name, `%${q.trim()}%`))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const rows = await db
    .select()
    .from(schema.items)
    .where(where)
    .orderBy(desc(schema.items.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function itemsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = itemInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid item input', issues: parsed.error.issues })
  }
  const input = parsed.data

  const [row] = await db
    .insert(schema.items)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      history: input.history,
      ownerNpcId: input.ownerNpcId,
      locationId: input.locationId,
    })
    .returning()
  return res.status(201).json(row)
}

export async function itemGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.items).where(eq(schema.items.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Item not found' })
  }
  return res.status(200).json(row)
}

export async function itemExport(_req: VercelRequest, res: VercelResponse, id: string) {
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
