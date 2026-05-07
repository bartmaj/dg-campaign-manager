import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc, eq, like, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../../db/client.js'
import { factionInputSchema } from '../../domain/faction.js'
import { factionStatusEventInputSchema } from '../../domain/factionStatus.js'
import { serializeEntity } from '../../domain/mdExport.js'
import { deleteEntityEdges } from '../_lib/cascade.js'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export.js'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function factionsList(req: VercelRequest, res: VercelResponse) {
  const q = singleParam(req.query.q as string | string[] | undefined)
  const where = q && q.trim().length > 0 ? like(schema.factions.name, `%${q.trim()}%`) : undefined

  const rows = await db
    .select()
    .from(schema.factions)
    .where(where)
    .orderBy(desc(schema.factions.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function factionsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = factionInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid faction input', issues: parsed.error.issues })
  }
  const input = parsed.data

  const [row] = await db
    .insert(schema.factions)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      agenda: input.agenda,
    })
    .returning()
  return res.status(201).json(row)
}

export async function factionGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.factions).where(eq(schema.factions.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Faction not found' })
  }
  return res.status(200).json(row)
}

export async function factionExport(_req: VercelRequest, res: VercelResponse, id: string) {
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

const factionPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    agenda: z.string().nullable().optional(),
  })
  .strict()

export async function factionPatch(req: VercelRequest, res: VercelResponse, id: string) {
  const parsed = factionPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid faction patch input', issues: parsed.error.issues })
  }
  const patch = parsed.data
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Empty patch' })
  }
  const [row] = await db
    .update(schema.factions)
    .set({ ...patch, updatedAt: sql`(unixepoch())` })
    .where(eq(schema.factions.id, id))
    .returning()
  if (!row) return res.status(404).json({ error: 'Faction not found' })
  return res.status(200).json(row)
}

// ─── Faction status timeline (#020) ─────────────────────────────────────────

export async function factionStatusList(
  _req: VercelRequest,
  res: VercelResponse,
  factionId: string,
) {
  const rows = await db
    .select()
    .from(schema.factionStatusEvents)
    .where(eq(schema.factionStatusEvents.factionId, factionId))
    .orderBy(asc(schema.factionStatusEvents.occurredAt), asc(schema.factionStatusEvents.createdAt))
    .limit(500)
  return res.status(200).json(rows)
}

export async function factionStatusCreate(
  req: VercelRequest,
  res: VercelResponse,
  factionId: string,
) {
  // Allow factionId to come from either the URL or the body; prefer URL.
  const body = (req.body ?? {}) as Record<string, unknown>
  const parsed = factionStatusEventInputSchema.safeParse({
    ...body,
    factionId,
  })
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid faction status input', issues: parsed.error.issues })
  }
  const input = parsed.data

  const [row] = await db
    .insert(schema.factionStatusEvents)
    .values({
      factionId: input.factionId,
      note: input.note,
      occurredAt: input.occurredAt,
      sessionId: input.sessionId ?? null,
    })
    .returning()
  return res.status(201).json(row)
}

export async function factionStatusDelete(
  _req: VercelRequest,
  res: VercelResponse,
  eventId: string,
) {
  const [row] = await db
    .delete(schema.factionStatusEvents)
    .where(eq(schema.factionStatusEvents.id, eventId))
    .returning()
  if (!row) {
    return res.status(404).json({ error: 'Faction status event not found' })
  }
  return res.status(200).json(row)
}

/**
 * Delete a faction by id. faction_status_events cascade via FK.
 *
 * NOTE: Polymorphic edges referencing this faction become dangling. The
 * UI gracefully skips unresolved names. TODO: add a sweep job that
 * cleans up orphaned edges referencing deleted entities.
 */
export async function factionDelete(_req: VercelRequest, res: VercelResponse, id: string) {
  const found = await db.transaction(async (tx) => {
    const [row] = await tx.delete(schema.factions).where(eq(schema.factions.id, id)).returning()
    if (!row) return false
    await deleteEntityEdges(tx, 'faction', id)
    return true
  })
  if (!found) return res.status(404).json({ error: 'Faction not found' })
  return res.status(204).end()
}
