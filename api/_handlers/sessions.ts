import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, asc, desc, eq, inArray, like, or, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client.js'
import { ENTITY_TYPES, type EntityType } from '../../db/schema.js'
import { serializeEntity } from '../../domain/mdExport.js'
import { sessionInputSchema } from '../../domain/session.js'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export.js'

/**
 * Computes the set of session ids whose timeline "involves" a given
 * entity. Three sources are unioned:
 *   1. Edges from session → entity (session id is `source_id`).
 *   2. Edges from entity → session (session id is `target_id`).
 *   3. bond_damage_events tied to bonds where pc_id or target_id is the
 *      entity id (only meaningful when type is 'pc' or 'npc').
 *   4. san_change_events for this PC (only when type is 'pc').
 *
 * Returns an unordered list of session ids; the caller filters
 * `sessions` accordingly. Empty list ⇒ no involvement.
 */
async function sessionIdsInvolving(type: EntityType, id: string): Promise<string[]> {
  const incomingEdges = await db
    .select({ sessionId: schema.edges.sourceId })
    .from(schema.edges)
    .where(
      and(
        eq(schema.edges.sourceType, 'session'),
        eq(schema.edges.targetType, type),
        eq(schema.edges.targetId, id),
      ),
    )
  const outgoingEdges = await db
    .select({ sessionId: schema.edges.targetId })
    .from(schema.edges)
    .where(
      and(
        eq(schema.edges.sourceType, type),
        eq(schema.edges.sourceId, id),
        eq(schema.edges.targetType, 'session'),
      ),
    )

  const ids = new Set<string>()
  for (const r of incomingEdges) if (r.sessionId) ids.add(r.sessionId)
  for (const r of outgoingEdges) if (r.sessionId) ids.add(r.sessionId)

  if (type === 'pc' || type === 'npc') {
    const bondsRows = await db
      .select({ id: schema.bonds.id })
      .from(schema.bonds)
      .where(or(eq(schema.bonds.pcId, id), eq(schema.bonds.targetId, id)))
    const bondIds = bondsRows.map((b) => b.id)
    if (bondIds.length > 0) {
      const damageRows = await db
        .select({ sessionId: schema.bondDamageEvents.sessionId })
        .from(schema.bondDamageEvents)
        .where(inArray(schema.bondDamageEvents.bondId, bondIds))
      for (const r of damageRows) if (r.sessionId) ids.add(r.sessionId)
    }
  }

  if (type === 'pc') {
    const sanRows = await db
      .select({ sessionId: schema.sanChangeEvents.sessionId })
      .from(schema.sanChangeEvents)
      .where(eq(schema.sanChangeEvents.pcId, id))
    for (const r of sanRows) if (r.sessionId) ids.add(r.sessionId)
  }

  return [...ids]
}

export async function sessionsList(req: VercelRequest, res: VercelResponse) {
  const orderByParam = req.query.orderBy
  const orderBy = Array.isArray(orderByParam) ? orderByParam[0] : orderByParam
  const useInGame = orderBy === 'inGame'

  const qParam = req.query.q
  const q = Array.isArray(qParam) ? qParam[0] : qParam

  const involvesTypeParam = req.query.involvesType
  const involvesIdParam = req.query.involvesId
  const involvesType = Array.isArray(involvesTypeParam) ? involvesTypeParam[0] : involvesTypeParam
  const involvesId = Array.isArray(involvesIdParam) ? involvesIdParam[0] : involvesIdParam

  const conds: SQL[] = []
  if (q && q.trim().length > 0) {
    conds.push(like(schema.sessions.name, `%${q.trim()}%`))
  }

  if (involvesType && involvesId) {
    if (!ENTITY_TYPES.includes(involvesType as EntityType)) {
      return res.status(400).json({ error: 'Invalid involvesType' })
    }
    const ids = await sessionIdsInvolving(involvesType as EntityType, involvesId)
    if (ids.length === 0) {
      return res.status(200).json([])
    }
    conds.push(inArray(schema.sessions.id, ids))
  }

  const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds)

  const rows = await db
    .select()
    .from(schema.sessions)
    .where(where)
    .orderBy(desc(schema.sessions.updatedAt))
    .limit(500)

  const sorted = [...rows].sort((a, b) => {
    const ka = useInGame ? a.inGameDate : a.realWorldDate
    const kb = useInGame ? b.inGameDate : b.realWorldDate
    const ta =
      ka === null || ka === undefined
        ? null
        : ka instanceof Date
          ? ka.getTime()
          : Date.parse(ka as string)
    const tb =
      kb === null || kb === undefined
        ? null
        : kb instanceof Date
          ? kb.getTime()
          : Date.parse(kb as string)
    if (ta === null && tb === null) return 0
    if (ta === null || Number.isNaN(ta)) return 1
    if (tb === null || Number.isNaN(tb)) return -1
    return ta - tb
  })

  return res.status(200).json(sorted)
}

export async function sessionsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = sessionInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid session input', issues: parsed.error.issues })
  }
  const input = parsed.data

  let campaignId = input.campaignId
  if (!campaignId) {
    const [existing] = await db
      .select()
      .from(schema.campaigns)
      .orderBy(asc(schema.campaigns.createdAt))
      .limit(1)
    if (existing) {
      campaignId = existing.id
    } else {
      const inserted = await db
        .insert(schema.campaigns)
        .values({ name: 'Default Campaign', description: null })
        .returning()
      const created = inserted[0]
      if (!created) {
        return res.status(500).json({ error: 'Failed to auto-create default campaign' })
      }
      campaignId = created.id
    }
  }

  const [row] = await db
    .insert(schema.sessions)
    .values({
      campaignId,
      name: input.name,
      description: input.description,
      inGameDate: input.inGameDate,
      inGameDateEnd: input.inGameDateEnd,
      realWorldDate: input.realWorldDate,
    })
    .returning()
  return res.status(201).json(row)
}

export async function sessionGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Session not found' })
  }
  return res.status(200).json(row)
}

export async function sessionExport(_req: VercelRequest, res: VercelResponse, id: string) {
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

/**
 * Delete a session by id.
 *
 * NOTE: Polymorphic edges referencing this session become dangling. The
 * UI gracefully skips unresolved names. TODO: add a sweep job that
 * cleans up orphaned edges referencing deleted entities.
 */
export async function sessionDelete(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.delete(schema.sessions).where(eq(schema.sessions.id, id)).returning()
  if (!row) {
    return res.status(404).json({ error: 'Session not found' })
  }
  return res.status(204).end()
}
