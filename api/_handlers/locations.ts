import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { locationInputSchema } from '../../domain/location'
import { serializeEntity } from '../../domain/mdExport'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

export async function locationsList(_req: VercelRequest, res: VercelResponse) {
  const rows = await db
    .select()
    .from(schema.locations)
    .orderBy(desc(schema.locations.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function locationsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = locationInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid location input', issues: parsed.error.issues })
  }
  const input = parsed.data

  const [row] = await db
    .insert(schema.locations)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      parentLocationId: input.parentLocationId,
    })
    .returning()
  return res.status(201).json(row)
}

export async function locationGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.locations).where(eq(schema.locations.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Location not found' })
  }
  return res.status(200).json(row)
}

export async function locationExport(_req: VercelRequest, res: VercelResponse, id: string) {
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
