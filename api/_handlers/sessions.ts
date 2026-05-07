import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, asc, desc, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../../db/client.js'
import { ENTITY_TYPES, type EntityType } from '../../db/schema.js'
import { serializeEntity, serializeSessionHandout, slugifyName } from '../../domain/mdExport.js'
import { sessionInputSchema } from '../../domain/session.js'
import { deleteEntityEdges } from '../_lib/cascade.js'
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

  if (type === 'npc') {
    const encounterRows = await db
      .select({ sessionId: schema.npcEncounterEvents.sessionId })
      .from(schema.npcEncounterEvents)
      .where(eq(schema.npcEncounterEvents.npcId, id))
    for (const r of encounterRows) if (r.sessionId) ids.add(r.sessionId)
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
/**
 * Lists clues currently delivered in a given session (#025).
 *
 * Folds the delivery event log per (clueId, sessionId) — only entries
 * that survive the fold (last event for that pair was `delivered`)
 * appear in the response.
 */
export async function sessionDeliveredClues(
  _req: VercelRequest,
  res: VercelResponse,
  sessionId: string,
) {
  // Pull every delivery event whose sessionId matches; we need siblings
  // for the same (clueId, sessionId) so we know whether `delivered` is
  // the latest event.
  const rows = await db
    .select()
    .from(schema.clueDeliveryEvents)
    .where(eq(schema.clueDeliveryEvents.sessionId, sessionId))
    .orderBy(asc(schema.clueDeliveryEvents.appliedAt), asc(schema.clueDeliveryEvents.id))

  // Group by clueId; the last event in each group wins.
  const byClue = new Map<
    string,
    { kind: 'delivered' | 'undelivered'; pcIds: string[]; appliedAt: Date }
  >()
  for (const r of rows) {
    const at =
      r.appliedAt instanceof Date ? r.appliedAt : new Date(r.appliedAt as unknown as string)
    byClue.set(r.clueId, {
      kind: r.kind as 'delivered' | 'undelivered',
      pcIds: (r.pcIds ?? []) as string[],
      appliedAt: at,
    })
  }

  const liveClueIds = [...byClue.entries()]
    .filter(([, v]) => v.kind === 'delivered')
    .map(([id]) => id)

  if (liveClueIds.length === 0) {
    return res.status(200).json({ items: [] })
  }

  const clueRows = await db
    .select({ id: schema.clues.id, name: schema.clues.name })
    .from(schema.clues)
    .where(inArray(schema.clues.id, liveClueIds))

  const nameById = new Map(clueRows.map((c) => [c.id, c.name]))

  const items = liveClueIds.map((clueId) => {
    const cur = byClue.get(clueId)!
    return {
      clueId,
      clueName: nameById.get(clueId) ?? clueId,
      pcIds: cur.pcIds,
      appliedAt: cur.appliedAt.toISOString(),
    }
  })

  return res.status(200).json({ items })
}

/**
 * Lists NPCs encountered in a given session (#026). One row per encounter
 * event — same shape as `sessionDeliveredClues`. NPCs are looked up so the
 * response carries display names directly.
 */
export async function sessionEncounteredNpcs(
  _req: VercelRequest,
  res: VercelResponse,
  sessionId: string,
) {
  const rows = await db
    .select()
    .from(schema.npcEncounterEvents)
    .where(eq(schema.npcEncounterEvents.sessionId, sessionId))
    .orderBy(asc(schema.npcEncounterEvents.appliedAt), asc(schema.npcEncounterEvents.id))

  if (rows.length === 0) return res.status(200).json({ items: [] })

  const npcIds = [...new Set(rows.map((r) => r.npcId))]
  const npcRows = await db
    .select({ id: schema.npcs.id, name: schema.npcs.name })
    .from(schema.npcs)
    .where(inArray(schema.npcs.id, npcIds))
  const nameById = new Map(npcRows.map((n) => [n.id, n.name]))

  const items = rows.map((r) => ({
    id: r.id,
    npcId: r.npcId,
    npcName: nameById.get(r.npcId) ?? r.npcId,
    note: r.note,
    appliedAt:
      r.appliedAt instanceof Date
        ? r.appliedAt.toISOString()
        : new Date(r.appliedAt as unknown as string).toISOString(),
  }))
  return res.status(200).json({ items })
}

export async function sessionDelete(_req: VercelRequest, res: VercelResponse, id: string) {
  const found = await db.transaction(async (tx) => {
    const [row] = await tx.delete(schema.sessions).where(eq(schema.sessions.id, id)).returning()
    if (!row) return false
    await deleteEntityEdges(tx, 'session', id)
    return true
  })
  if (!found) return res.status(404).json({ error: 'Session not found' })
  return res.status(204).end()
}

const sessionPatchSchema = z
  .object({
    notes: z.string().nullable().optional(),
    playerNotes: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    name: z.string().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Empty patch' })

/**
 * Patch a session — partial update for `notes`, `description`, `name`.
 * Mirrors the narrow PATCH on PCs (see pcs.ts#pcPatch).
 */
export async function sessionPatch(req: VercelRequest, res: VercelResponse, id: string) {
  const parsed = sessionPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid session patch input', issues: parsed.error.issues })
  }
  const patch = parsed.data
  const [row] = await db
    .update(schema.sessions)
    .set({ ...patch, updatedAt: sql`(unixepoch())` })
    .where(eq(schema.sessions.id, id))
    .returning()
  if (!row) {
    return res.status(404).json({ error: 'Session not found' })
  }
  return res.status(200).json(row)
}

// ─── Session report (#027) ──────────────────────────────────────────────────
// Aggregates the four session-scoped event tables into a single chronological
// log. Names are batch-resolved server-side so the wire payload is
// self-contained — the UI never has to round-trip names per row.

type ReportPcIds = readonly string[]

export type SessionReportItem =
  | {
      kind: 'clue_delivered'
      appliedAt: string
      clueId: string
      clueName: string
      pcIds: ReportPcIds
      note: string | null
    }
  | {
      kind: 'clue_undelivered'
      appliedAt: string
      clueId: string
      clueName: string
      pcIds: ReportPcIds
      note: string | null
    }
  | {
      kind: 'npc_encountered'
      appliedAt: string
      npcId: string
      npcName: string
      note: string | null
    }
  | {
      kind: 'bond_damage'
      appliedAt: string
      bondId: string
      bondName: string
      pcId: string
      delta: number
      reason: string | null
    }
  | {
      kind: 'san_change'
      appliedAt: string
      pcId: string
      pcName: string
      delta: number
      source: string
      crossedThresholds: number[]
    }

export type SessionReport = {
  sessionId: string
  items: SessionReportItem[]
  generatedAt: string
}

function toIso(v: Date | string | number): string {
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'number') return new Date(v).toISOString()
  return v
}

export async function sessionReport(_req: VercelRequest, res: VercelResponse, sessionId: string) {
  // Confirm session exists; mirrors sessionGet behavior.
  const [session] = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  // Run the four event-table queries in parallel.
  const [clueRows, npcRows, sanRows] = await Promise.all([
    db
      .select()
      .from(schema.clueDeliveryEvents)
      .where(eq(schema.clueDeliveryEvents.sessionId, sessionId)),
    db
      .select()
      .from(schema.npcEncounterEvents)
      .where(eq(schema.npcEncounterEvents.sessionId, sessionId)),
    db.select().from(schema.sanChangeEvents).where(eq(schema.sanChangeEvents.sessionId, sessionId)),
  ])

  // Bond damage events: filter by sessionId then join with bonds for the bond name.
  const bondDamageRows = await db
    .select()
    .from(schema.bondDamageEvents)
    .where(eq(schema.bondDamageEvents.sessionId, sessionId))

  // Batch-resolve names. Bonds need a separate query (no name in events).
  const clueIds = [...new Set(clueRows.map((r) => r.clueId))]
  const npcIds = [...new Set(npcRows.map((r) => r.npcId))]
  const sanPcIds = [...new Set(sanRows.map((r) => r.pcId))]
  const bondIds = [...new Set(bondDamageRows.map((r) => r.bondId))]

  const [clueNameRows, npcNameRows, pcNameRows, bondInfoRows] = await Promise.all([
    clueIds.length === 0
      ? Promise.resolve([] as { id: string; name: string }[])
      : db
          .select({ id: schema.clues.id, name: schema.clues.name })
          .from(schema.clues)
          .where(inArray(schema.clues.id, clueIds)),
    npcIds.length === 0
      ? Promise.resolve([] as { id: string; name: string }[])
      : db
          .select({ id: schema.npcs.id, name: schema.npcs.name })
          .from(schema.npcs)
          .where(inArray(schema.npcs.id, npcIds)),
    sanPcIds.length === 0
      ? Promise.resolve([] as { id: string; name: string }[])
      : db
          .select({ id: schema.pcs.id, name: schema.pcs.name })
          .from(schema.pcs)
          .where(inArray(schema.pcs.id, sanPcIds)),
    bondIds.length === 0
      ? Promise.resolve([] as { id: string; name: string; pcId: string }[])
      : db
          .select({ id: schema.bonds.id, name: schema.bonds.name, pcId: schema.bonds.pcId })
          .from(schema.bonds)
          .where(inArray(schema.bonds.id, bondIds)),
  ])

  const clueName = new Map(clueNameRows.map((r) => [r.id, r.name]))
  const npcName = new Map(npcNameRows.map((r) => [r.id, r.name]))
  const pcName = new Map(pcNameRows.map((r) => [r.id, r.name]))
  const bondInfo = new Map(bondInfoRows.map((r) => [r.id, r]))

  const items: SessionReportItem[] = []

  for (const r of clueRows) {
    const k = r.kind === 'undelivered' ? 'clue_undelivered' : 'clue_delivered'
    items.push({
      kind: k,
      appliedAt: toIso(r.appliedAt as Date | string),
      clueId: r.clueId,
      clueName: clueName.get(r.clueId) ?? r.clueId,
      pcIds: (r.pcIds ?? []) as string[],
      note: r.note ?? null,
    })
  }

  for (const r of npcRows) {
    items.push({
      kind: 'npc_encountered',
      appliedAt: toIso(r.appliedAt as Date | string),
      npcId: r.npcId,
      npcName: npcName.get(r.npcId) ?? r.npcId,
      note: r.note ?? null,
    })
  }

  for (const r of bondDamageRows) {
    const info = bondInfo.get(r.bondId)
    items.push({
      kind: 'bond_damage',
      appliedAt: toIso(r.appliedAt as Date | string),
      bondId: r.bondId,
      bondName: info?.name ?? r.bondId,
      pcId: info?.pcId ?? '',
      delta: r.delta,
      reason: r.reason ?? null,
    })
  }

  for (const r of sanRows) {
    items.push({
      kind: 'san_change',
      appliedAt: toIso(r.appliedAt as Date | string),
      pcId: r.pcId,
      pcName: pcName.get(r.pcId) ?? r.pcId,
      delta: r.delta,
      source: r.source,
      crossedThresholds: (r.crossedThresholds ?? []) as number[],
    })
  }

  // Chronological — ascending appliedAt. Stable secondary by kind for
  // ties (the four event tables share unixepoch precision).
  items.sort((a, b) => {
    const ta = Date.parse(a.appliedAt)
    const tb = Date.parse(b.appliedAt)
    if (ta !== tb) return ta - tb
    return a.kind.localeCompare(b.kind)
  })

  const payload: SessionReport = {
    sessionId,
    items,
    generatedAt: new Date().toISOString(),
  }
  return res.status(200).json(payload)
}

// ─── Session handout (#028, REQ-012) ────────────────────────────────────────
//
// Player-safe Markdown handout. Strict redaction:
//   - The shape passed to `serializeSessionHandout` is the safety boundary —
//     only `name`, `profession`, `description` (and only on clues/locations)
//     reach the serializer. NPC mannerisms / voice / secrets / currentGoal,
//     PC SAN / breaking points, bond damage etc. are never wired in.
//   - Inline-redaction primitive: any clue or location whose `description`
//     begins with the literal `[GM]` prefix has its description omitted from
//     the handout. The entity's NAME still appears so players know it
//     exists. This gives the GM a per-field escape hatch without forcing
//     them to maintain a parallel "player description" column for every
//     clue and location.
//
// Locations are derived from two edge sources:
//   (a) `clue → location` `points_to` edges where the source clue was
//       delivered in this session.
//   (b) `npc → location` `occupies` / `frequents` edges for any NPC
//       encountered in this session.
export async function sessionHandout(_req: VercelRequest, res: VercelResponse, sessionId: string) {
  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  // ─── Delivered clues ────────────────────────────────────────────────────
  // Fold the per-clue event log: keep only clues whose latest event in this
  // session is `delivered` (i.e. an `undelivered` follow-up cancels it).
  const deliveryRows = await db
    .select()
    .from(schema.clueDeliveryEvents)
    .where(eq(schema.clueDeliveryEvents.sessionId, sessionId))
    .orderBy(asc(schema.clueDeliveryEvents.appliedAt), asc(schema.clueDeliveryEvents.id))

  const lastByClue = new Map<string, 'delivered' | 'undelivered'>()
  for (const r of deliveryRows) lastByClue.set(r.clueId, r.kind as 'delivered' | 'undelivered')
  const deliveredClueIds = [...lastByClue.entries()]
    .filter(([, k]) => k === 'delivered')
    .map(([id]) => id)

  const clueRows =
    deliveredClueIds.length === 0
      ? []
      : await db
          .select({
            id: schema.clues.id,
            name: schema.clues.name,
            description: schema.clues.description,
          })
          .from(schema.clues)
          .where(inArray(schema.clues.id, deliveredClueIds))

  // ─── Encountered NPCs ──────────────────────────────────────────────────
  const encounterRows = await db
    .select({ npcId: schema.npcEncounterEvents.npcId })
    .from(schema.npcEncounterEvents)
    .where(eq(schema.npcEncounterEvents.sessionId, sessionId))
  const encounteredNpcIds = [...new Set(encounterRows.map((r) => r.npcId))]

  const npcRows =
    encounteredNpcIds.length === 0
      ? []
      : await db
          .select({
            id: schema.npcs.id,
            name: schema.npcs.name,
            profession: schema.npcs.profession,
          })
          .from(schema.npcs)
          .where(inArray(schema.npcs.id, encounteredNpcIds))

  // ─── Locations ─────────────────────────────────────────────────────────
  // (a) clue→location 'points_to' edges from delivered clues.
  // (b) npc→location 'occupies'/'frequents' edges from encountered NPCs.
  const locationIds = new Set<string>()
  if (deliveredClueIds.length > 0) {
    const clueLocEdges = await db
      .select({ targetId: schema.edges.targetId })
      .from(schema.edges)
      .where(
        and(
          eq(schema.edges.sourceType, 'clue'),
          inArray(schema.edges.sourceId, deliveredClueIds),
          eq(schema.edges.targetType, 'location'),
          eq(schema.edges.kind, 'points_to'),
        ),
      )
    for (const r of clueLocEdges) locationIds.add(r.targetId)
  }
  if (encounteredNpcIds.length > 0) {
    const npcLocEdges = await db
      .select({ targetId: schema.edges.targetId, kind: schema.edges.kind })
      .from(schema.edges)
      .where(
        and(
          eq(schema.edges.sourceType, 'npc'),
          inArray(schema.edges.sourceId, encounteredNpcIds),
          eq(schema.edges.targetType, 'location'),
          inArray(schema.edges.kind, ['occupies', 'frequents']),
        ),
      )
    for (const r of npcLocEdges) locationIds.add(r.targetId)
  }

  const locationRows =
    locationIds.size === 0
      ? []
      : await db
          .select({
            id: schema.locations.id,
            name: schema.locations.name,
            description: schema.locations.description,
          })
          .from(schema.locations)
          .where(inArray(schema.locations.id, [...locationIds]))

  const realWorldDateMs =
    session.realWorldDate === null || session.realWorldDate === undefined
      ? null
      : session.realWorldDate instanceof Date
        ? session.realWorldDate.getTime()
        : Number.isNaN(Date.parse(String(session.realWorldDate)))
          ? null
          : Date.parse(String(session.realWorldDate))

  const md = serializeSessionHandout({
    session: {
      name: session.name,
      inGameDate: session.inGameDate,
      realWorldDate: realWorldDateMs,
      playerNotes: session.playerNotes,
    },
    clues: clueRows.map((c) => ({ name: c.name, description: c.description })),
    npcs: npcRows.map((n) => ({ name: n.name, profession: n.profession })),
    locations: locationRows.map((l) => ({ name: l.name, description: l.description })),
  })

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="handout-${slugifyName(session.name)}.md"`,
  )
  return res.status(200).send(md)
}
