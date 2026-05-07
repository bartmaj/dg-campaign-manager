import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, desc, eq, like, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../../db/client.js'
import { locationInputSchema } from '../../domain/location.js'
import { serializeEntity } from '../../domain/mdExport.js'
import { deleteEntityEdges } from '../_lib/cascade.js'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export.js'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function locationsList(req: VercelRequest, res: VercelResponse) {
  const parentLocationId = singleParam(req.query.parentLocationId as string | string[] | undefined)
  const q = singleParam(req.query.q as string | string[] | undefined)

  const conditions: SQL[] = []
  if (parentLocationId) {
    conditions.push(eq(schema.locations.parentLocationId, parentLocationId))
  }
  if (q && q.trim().length > 0) conditions.push(like(schema.locations.name, `%${q.trim()}%`))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const rows = await db
    .select()
    .from(schema.locations)
    .where(where)
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

const locationPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    parentLocationId: z.string().min(1).nullable().optional(),
  })
  .strict()

export async function locationPatch(req: VercelRequest, res: VercelResponse, id: string) {
  const parsed = locationPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid location patch input', issues: parsed.error.issues })
  }
  const patch = parsed.data
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Empty patch' })
  }
  // Guard against self-parenting (id === parentLocationId).
  if (patch.parentLocationId !== undefined && patch.parentLocationId === id) {
    return res.status(400).json({ error: 'Location cannot be its own parent' })
  }
  const [row] = await db
    .update(schema.locations)
    .set({ ...patch, updatedAt: sql`(unixepoch())` })
    .where(eq(schema.locations.id, id))
    .returning()
  if (!row) return res.status(404).json({ error: 'Location not found' })
  return res.status(200).json(row)
}

/**
 * Delete a location by id.
 *
 * NOTE: Polymorphic edges referencing this location become dangling. The
 * UI gracefully skips unresolved names. TODO: add a sweep job that
 * cleans up orphaned edges referencing deleted entities.
 */
export async function locationDelete(_req: VercelRequest, res: VercelResponse, id: string) {
  const found = await db.transaction(async (tx) => {
    const [row] = await tx.delete(schema.locations).where(eq(schema.locations.id, id)).returning()
    if (!row) return false
    await deleteEntityEdges(tx, 'location', id)
    return true
  })
  if (!found) return res.status(404).json({ error: 'Location not found' })
  return res.status(204).end()
}
