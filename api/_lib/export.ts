/**
 * Shared helpers for the per-entity Markdown export endpoints (#015).
 *
 * - `loadEdgeContext`: fetches outgoing + incoming edges for an entity
 *   and resolves a `entityNameById` map by querying every related row's
 *   name in a single batch per target table. Done eagerly because the
 *   per-table batch is small (a single detail page rarely cross-links
 *   into more than a few dozen related entities) and it keeps the
 *   serializer pure.
 * - `sendMarkdown`: writes the Markdown response with the right
 *   Content-Type, Content-Disposition and a deterministic body.
 */
import type { VercelResponse } from '@vercel/node'
import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import type { EntityType } from '../../db/schema'
import { slugifyName } from '../../domain/mdExport'

type AnyEdgeRow = typeof schema.edges.$inferSelect

export type EdgeContext = {
  outgoing: AnyEdgeRow[]
  incoming: AnyEdgeRow[]
  entityNameById: Record<string, string>
}

/**
 * Fetches all outgoing edges (sourceType, sourceId) and incoming edges
 * (targetType, targetId) for one entity, then collects names for every
 * related id by querying each relevant entity table in a single
 * `IN (…)` batch. Tables not referenced by any edge are skipped.
 */
export async function loadEdgeContext(
  entityType: EntityType,
  entityId: string,
): Promise<EdgeContext> {
  const [outgoing, incoming] = await Promise.all([
    db
      .select()
      .from(schema.edges)
      .where(and(eq(schema.edges.sourceType, entityType), eq(schema.edges.sourceId, entityId))),
    db
      .select()
      .from(schema.edges)
      .where(and(eq(schema.edges.targetType, entityType), eq(schema.edges.targetId, entityId))),
  ])

  // Collect (type → ids) from every edge endpoint that isn't the
  // entity itself. Bond endpoints don't have a "name" of their own;
  // skip those — the serializer can fall back to the raw id.
  const idsByType: Partial<Record<EntityType, Set<string>>> = {}
  for (const e of outgoing) {
    if (e.targetType === entityType && e.targetId === entityId) continue
    ;(idsByType[e.targetType] ??= new Set()).add(e.targetId)
  }
  for (const e of incoming) {
    if (e.sourceType === entityType && e.sourceId === entityId) continue
    ;(idsByType[e.sourceType] ??= new Set()).add(e.sourceId)
  }

  const nameMap: Record<string, string> = {}
  await Promise.all(
    (Object.entries(idsByType) as [EntityType, Set<string>][]).map(async ([type, idSet]) => {
      const ids = [...idSet]
      if (ids.length === 0) return
      const rows = await fetchNamesForType(type, ids)
      for (const r of rows) nameMap[r.id] = r.name
    }),
  )
  return { outgoing, incoming, entityNameById: nameMap }
}

async function fetchNamesForType(
  type: EntityType,
  ids: string[],
): Promise<Array<{ id: string; name: string }>> {
  switch (type) {
    case 'pc':
      return db
        .select({ id: schema.pcs.id, name: schema.pcs.name })
        .from(schema.pcs)
        .where(inArray(schema.pcs.id, ids))
    case 'npc':
      return db
        .select({ id: schema.npcs.id, name: schema.npcs.name })
        .from(schema.npcs)
        .where(inArray(schema.npcs.id, ids))
    case 'clue':
      return db
        .select({ id: schema.clues.id, name: schema.clues.name })
        .from(schema.clues)
        .where(inArray(schema.clues.id, ids))
    case 'faction':
      return db
        .select({ id: schema.factions.id, name: schema.factions.name })
        .from(schema.factions)
        .where(inArray(schema.factions.id, ids))
    case 'item':
      return db
        .select({ id: schema.items.id, name: schema.items.name })
        .from(schema.items)
        .where(inArray(schema.items.id, ids))
    case 'location':
      return db
        .select({ id: schema.locations.id, name: schema.locations.name })
        .from(schema.locations)
        .where(inArray(schema.locations.id, ids))
    case 'session':
      return db
        .select({ id: schema.sessions.id, name: schema.sessions.name })
        .from(schema.sessions)
        .where(inArray(schema.sessions.id, ids))
    case 'scenario':
      return db
        .select({ id: schema.scenarios.id, name: schema.scenarios.name })
        .from(schema.scenarios)
        .where(inArray(schema.scenarios.id, ids))
    case 'scene':
      return db
        .select({ id: schema.scenes.id, name: schema.scenes.name })
        .from(schema.scenes)
        .where(inArray(schema.scenes.id, ids))
    case 'bond':
    case 'campaign':
      // Bonds and campaigns aren't referenced by edges in EDGE_RULES;
      // and even if they were, their detail-page name resolution is
      // handled by the entity's own detail page.
      return []
  }
}

/**
 * Serializes the entity's name into a fragment safe for a downloaded
 * filename. Any non-ASCII or punctuation collapses to hyphens.
 */
export function exportFilename(entityRoute: string, name: string): string {
  return `${entityRoute}-${slugifyName(name)}.md`
}

export function sendMarkdown(res: VercelResponse, body: string, filename: string): VercelResponse {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  // 200 + body; bypass JSON serializer.
  return res.status(200).send(body)
}

/**
 * Coerces an edge row from the DB (with `Date` createdAt) into the
 * wire-format `ExportEdge` (ISO string createdAt). The serializer never
 * reads `createdAt` so this is mostly type-noise — but doing the
 * coercion keeps both call sites honest.
 */
export function toExportEdges(rows: AnyEdgeRow[]): Array<{
  id: string
  sourceType: EntityType
  sourceId: string
  targetType: EntityType
  targetId: string
  kind: string
  notes: string | null
  createdAt: string
}> {
  return rows.map((r) => ({
    id: r.id,
    sourceType: r.sourceType,
    sourceId: r.sourceId,
    targetType: r.targetType,
    targetId: r.targetId,
    kind: r.kind,
    notes: r.notes,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  }))
}
