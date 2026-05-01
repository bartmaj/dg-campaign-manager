import type { VercelRequest, VercelResponse } from '@vercel/node'
import { inArray } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import type { EntityType } from '../../db/schema'

/**
 * GET /api/search/index — flat search index for the SPA's Cmd-K palette.
 *
 * Per ADR-003 (architecture.md §9), search is implemented as an
 * in-memory fuzzy match on the SPA side. The server's only job is to
 * serialize a compact `{ items: SearchIndexItem[] }` payload covering
 * every entity table.
 *
 * One query per table; small batched name lookups for the few subtitles
 * that need a parent name. No pagination — datasets are expected in the
 * hundreds-to-low-thousands range (REQ-N01 covers 1k entities).
 */

export type SearchIndexItem = {
  id: string
  type: EntityType
  name: string
  subtitle?: string
}

export type SearchIndexResponse = {
  items: SearchIndexItem[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Pull every table in parallel — they're independent reads.
  const [scenarios, scenes, pcs, npcs, clues, items, factions, locations, sessions, bonds] =
    await Promise.all([
      db.select({ id: schema.scenarios.id, name: schema.scenarios.name }).from(schema.scenarios),
      db
        .select({
          id: schema.scenes.id,
          name: schema.scenes.name,
          scenarioId: schema.scenes.scenarioId,
        })
        .from(schema.scenes),
      db.select({ id: schema.pcs.id, name: schema.pcs.name }).from(schema.pcs),
      db
        .select({
          id: schema.npcs.id,
          name: schema.npcs.name,
          profession: schema.npcs.profession,
          factionId: schema.npcs.factionId,
        })
        .from(schema.npcs),
      db
        .select({
          id: schema.clues.id,
          name: schema.clues.name,
          originScenarioId: schema.clues.originScenarioId,
        })
        .from(schema.clues),
      db
        .select({
          id: schema.items.id,
          name: schema.items.name,
          ownerNpcId: schema.items.ownerNpcId,
          locationId: schema.items.locationId,
        })
        .from(schema.items),
      db.select({ id: schema.factions.id, name: schema.factions.name }).from(schema.factions),
      db.select({ id: schema.locations.id, name: schema.locations.name }).from(schema.locations),
      db.select({ id: schema.sessions.id, name: schema.sessions.name }).from(schema.sessions),
      db
        .select({
          id: schema.bonds.id,
          name: schema.bonds.name,
          pcId: schema.bonds.pcId,
          targetType: schema.bonds.targetType,
          targetId: schema.bonds.targetId,
        })
        .from(schema.bonds),
    ])

  // Batched name lookups for subtitles. Each is a single SELECT … WHERE id IN (…).
  const factionIds = uniq(npcs.map((n) => n.factionId))
  const scenarioIds = uniq([
    ...scenes.map((s) => s.scenarioId),
    ...clues.map((c) => c.originScenarioId),
  ])
  const ownerNpcIds = uniq(items.map((i) => i.ownerNpcId))
  const itemLocationIds = uniq(items.map((i) => i.locationId))
  const bondPcIds = uniq(bonds.map((b) => b.pcId))
  const bondTargetNpcIds = uniq(bonds.filter((b) => b.targetType === 'npc').map((b) => b.targetId))
  const bondTargetPcIds = uniq(bonds.filter((b) => b.targetType === 'pc').map((b) => b.targetId))

  const [
    factionNamesRows,
    scenarioNamesRows,
    ownerNpcNamesRows,
    itemLocationNamesRows,
    bondPcNamesRows,
    bondTargetNpcNamesRows,
    bondTargetPcNamesRows,
  ] = await Promise.all([
    factionIds.length > 0
      ? db
          .select({ id: schema.factions.id, name: schema.factions.name })
          .from(schema.factions)
          .where(inArray(schema.factions.id, factionIds))
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    scenarioIds.length > 0
      ? db
          .select({ id: schema.scenarios.id, name: schema.scenarios.name })
          .from(schema.scenarios)
          .where(inArray(schema.scenarios.id, scenarioIds))
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    ownerNpcIds.length > 0
      ? db
          .select({ id: schema.npcs.id, name: schema.npcs.name })
          .from(schema.npcs)
          .where(inArray(schema.npcs.id, ownerNpcIds))
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    itemLocationIds.length > 0
      ? db
          .select({ id: schema.locations.id, name: schema.locations.name })
          .from(schema.locations)
          .where(inArray(schema.locations.id, itemLocationIds))
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    bondPcIds.length > 0
      ? db
          .select({ id: schema.pcs.id, name: schema.pcs.name })
          .from(schema.pcs)
          .where(inArray(schema.pcs.id, bondPcIds))
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    bondTargetNpcIds.length > 0
      ? db
          .select({ id: schema.npcs.id, name: schema.npcs.name })
          .from(schema.npcs)
          .where(inArray(schema.npcs.id, bondTargetNpcIds))
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    bondTargetPcIds.length > 0
      ? db
          .select({ id: schema.pcs.id, name: schema.pcs.name })
          .from(schema.pcs)
          .where(inArray(schema.pcs.id, bondTargetPcIds))
      : Promise.resolve([] as Array<{ id: string; name: string }>),
  ])

  const factionNames = byId(factionNamesRows)
  const scenarioNames = byId(scenarioNamesRows)
  const ownerNpcNames = byId(ownerNpcNamesRows)
  const itemLocationNames = byId(itemLocationNamesRows)
  const bondPcNames = byId(bondPcNamesRows)
  const bondTargetNpcNames = byId(bondTargetNpcNamesRows)
  const bondTargetPcNames = byId(bondTargetPcNamesRows)

  const out: SearchIndexItem[] = []

  for (const r of scenarios) {
    out.push({ id: r.id, type: 'scenario', name: r.name })
  }
  for (const r of scenes) {
    const subtitle = r.scenarioId ? scenarioNames.get(r.scenarioId) : undefined
    out.push({ id: r.id, type: 'scene', name: r.name, subtitle })
  }
  for (const r of pcs) {
    out.push({ id: r.id, type: 'pc', name: r.name })
  }
  for (const r of npcs) {
    const factionName = r.factionId ? factionNames.get(r.factionId) : undefined
    const subtitle =
      [r.profession ?? undefined, factionName].filter(Boolean).join(' • ') || undefined
    out.push({ id: r.id, type: 'npc', name: r.name, subtitle })
  }
  for (const r of clues) {
    const subtitle = r.originScenarioId ? scenarioNames.get(r.originScenarioId) : undefined
    out.push({ id: r.id, type: 'clue', name: r.name, subtitle })
  }
  for (const r of items) {
    const owner = r.ownerNpcId ? ownerNpcNames.get(r.ownerNpcId) : undefined
    const loc = r.locationId ? itemLocationNames.get(r.locationId) : undefined
    const parts: string[] = []
    if (owner) parts.push(`held by ${owner}`)
    if (loc) parts.push(`at ${loc}`)
    const subtitle = parts.length > 0 ? parts.join(' • ') : undefined
    out.push({ id: r.id, type: 'item', name: r.name, subtitle })
  }
  for (const r of factions) {
    out.push({ id: r.id, type: 'faction', name: r.name })
  }
  for (const r of locations) {
    out.push({ id: r.id, type: 'location', name: r.name })
  }
  for (const r of sessions) {
    out.push({ id: r.id, type: 'session', name: r.name })
  }
  for (const r of bonds) {
    const pcName = bondPcNames.get(r.pcId)
    const targetName =
      r.targetType === 'pc' ? bondTargetPcNames.get(r.targetId) : bondTargetNpcNames.get(r.targetId)
    const parts: string[] = []
    if (pcName) parts.push(pcName)
    if (targetName) parts.push(`→ ${targetName}`)
    const subtitle = parts.length > 0 ? parts.join(' ') : undefined
    out.push({ id: r.id, type: 'bond', name: r.name, subtitle })
  }

  // Stable order: by (type, name).
  out.sort((a, b) => {
    if (a.type !== b.type) return a.type < b.type ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ items: out })
}

function uniq(values: ReadonlyArray<string | null | undefined>): string[] {
  const seen = new Set<string>()
  for (const v of values) {
    if (v) seen.add(v)
  }
  return Array.from(seen)
}

function byId(rows: ReadonlyArray<{ id: string; name: string }>): Map<string, string> {
  const m = new Map<string, string>()
  for (const r of rows) m.set(r.id, r.name)
  return m
}
