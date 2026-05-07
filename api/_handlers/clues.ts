import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, asc, desc, eq, like, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client.js'
import { clueInputSchema } from '../../domain/clue.js'
import {
  clueDeliveryInputSchema,
  computeDeliveryState,
  type DeliveryEvent,
} from '../../domain/clueDelivery.js'
import { serializeEntity } from '../../domain/mdExport.js'
import { deleteEntityEdges } from '../_lib/cascade.js'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export.js'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function cluesList(req: VercelRequest, res: VercelResponse) {
  const originScenarioId = singleParam(req.query.originScenarioId as string | string[] | undefined)
  const q = singleParam(req.query.q as string | string[] | undefined)

  const conditions: SQL[] = []
  if (originScenarioId) conditions.push(eq(schema.clues.originScenarioId, originScenarioId))
  if (q && q.trim().length > 0) conditions.push(like(schema.clues.name, `%${q.trim()}%`))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const rows = await db
    .select()
    .from(schema.clues)
    .where(where)
    .orderBy(desc(schema.clues.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function cluesCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = clueInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid clue input', issues: parsed.error.issues })
  }
  const input = parsed.data

  const [row] = await db
    .insert(schema.clues)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      originScenarioId: input.originScenarioId,
    })
    .returning()
  return res.status(201).json(row)
}

export async function clueGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.clues).where(eq(schema.clues.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Clue not found' })
  }
  return res.status(200).json(row)
}

export async function clueExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [clue] = await db.select().from(schema.clues).where(eq(schema.clues.id, id)).limit(1)
  if (!clue) return res.status(404).json({ error: 'Clue not found' })

  const edgeCtx = await loadEdgeContext('clue', id)
  const extraNames: Record<string, string> = {}
  if (clue.originScenarioId) {
    const [s] = await db
      .select({ id: schema.scenarios.id, name: schema.scenarios.name })
      .from(schema.scenarios)
      .where(eq(schema.scenarios.id, clue.originScenarioId))
      .limit(1)
    if (s) extraNames[s.id] = s.name
  }

  const md = serializeEntity({
    kind: 'clue',
    clue: {
      id: clue.id,
      name: clue.name,
      description: clue.description,
      originScenarioId: clue.originScenarioId,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
  })

  return sendMarkdown(res, md, exportFilename('clue', clue.name))
}

/**
 * Delete a clue by id.
 *
 * NOTE: Polymorphic edges referencing this clue become dangling. The UI
 * gracefully skips unresolved names. TODO: add a sweep job that cleans
 * up orphaned edges referencing deleted entities.
 */
export async function clueDelete(_req: VercelRequest, res: VercelResponse, id: string) {
  const found = await db.transaction(async (tx) => {
    const [row] = await tx.delete(schema.clues).where(eq(schema.clues.id, id)).returning()
    if (!row) return false
    await deleteEntityEdges(tx, 'clue', id)
    return true
  })
  if (!found) return res.status(404).json({ error: 'Clue not found' })
  return res.status(204).end()
}

// ─── Clue delivery (#025) ────────────────────────────────────────────────────
// Append-only event log. NEVER expose a DELETE — un-delivery is recorded as
// a `kind: 'undelivered'` event so the history is preserved.

function serializeDeliveryEvent(row: typeof schema.clueDeliveryEvents.$inferSelect) {
  return {
    id: row.id,
    clueId: row.clueId,
    sessionId: row.sessionId,
    kind: row.kind as 'delivered' | 'undelivered',
    pcIds: row.pcIds ?? [],
    note: row.note,
    appliedAt:
      row.appliedAt instanceof Date ? row.appliedAt.toISOString() : (row.appliedAt as string),
  }
}

export async function clueDeliveryList(_req: VercelRequest, res: VercelResponse, clueId: string) {
  const rows = await db
    .select()
    .from(schema.clueDeliveryEvents)
    .where(eq(schema.clueDeliveryEvents.clueId, clueId))
    .orderBy(asc(schema.clueDeliveryEvents.appliedAt), asc(schema.clueDeliveryEvents.id))
    .limit(500)

  const events = rows.map(serializeDeliveryEvent)
  const state = computeDeliveryState(
    events.map<DeliveryEvent>((e) => ({
      sessionId: e.sessionId,
      kind: e.kind,
      pcIds: e.pcIds,
      appliedAt: e.appliedAt,
    })),
  )
  const currentState = {
    isDelivered: state.isDelivered,
    sessions: [...state.delivered.entries()].map(([sessionId, cur]) => ({
      sessionId,
      pcIds: cur.pcIds,
      appliedAt: cur.appliedAt.toISOString(),
    })),
  }

  return res.status(200).json({ events, currentState })
}

export async function clueDeliveryCreate(req: VercelRequest, res: VercelResponse, clueId: string) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const parsed = clueDeliveryInputSchema.safeParse({ ...body, clueId })
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid clue delivery input', issues: parsed.error.issues })
  }
  const input = parsed.data

  // Verify referenced clue and session exist (FKs would catch this too, but
  // a 404 is friendlier than a SQLite constraint error).
  const [clue] = await db
    .select({ id: schema.clues.id })
    .from(schema.clues)
    .where(eq(schema.clues.id, input.clueId))
    .limit(1)
  if (!clue) return res.status(404).json({ error: 'Clue not found' })

  const [session] = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(eq(schema.sessions.id, input.sessionId))
    .limit(1)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const [row] = await db
    .insert(schema.clueDeliveryEvents)
    .values({
      clueId: input.clueId,
      sessionId: input.sessionId,
      kind: input.kind,
      pcIds: input.pcIds,
      note: input.note ?? null,
    })
    .returning()
  if (!row) return res.status(500).json({ error: 'Failed to insert delivery event' })
  return res.status(201).json(serializeDeliveryEvent(row))
}
