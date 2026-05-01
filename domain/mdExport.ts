/**
 * Pure-TS per-entity Markdown serializer (#015, REQ-017 / REQ-N04).
 *
 * Produces a deterministic, single-entity Markdown document for any of
 * the canonical entity types. The format is intentionally compatible
 * with `domain/mdImport.ts` at the wiki-link layer (`[[Name]]`) so that
 * exported snippets can be pasted into a scenario import doc and round
 * trip cleanly.
 *
 * ## Format
 *
 * ```md
 * # <Type>: <Name>
 *
 * - **Field A**: …
 * - **Field B**: …
 *
 * ## Outgoing relationships
 * - **kind** → [[Target Name]]
 *
 * ## Incoming relationships         (only when applicable)
 * - **kind** ← [[Source Name]]
 *
 * ## History / Bonds / SAN history  (entity-specific sections)
 * ```
 *
 * Per-entity sections (e.g. PC Sanity, NPC RP hooks) are emitted in a
 * fixed order documented in each `serialize<Entity>` helper below.
 *
 * ## Determinism contract (REQ-N04)
 *
 * - All collections (skills, motivations, edges, events, breaking
 *   points, disorders, adapted-to) are sorted by stable keys before
 *   emission. Edges sort by `(kind, targetType, targetName-or-id)`.
 * - The serializer never reads the clock and never includes
 *   `createdAt`/`updatedAt` columns — those move on every write and
 *   would defeat "stable across exports of the same unchanged entity".
 * - **Event timestamps are kept** for bond damage and SAN events
 *   because the event row itself is the data; once written the
 *   `appliedAt` is invariant.
 * - Output uses `\n` line endings and ends with a single trailing
 *   newline.
 *
 * ## Wiki-link references
 *
 * Edges to other entities are rendered as `[[Name]]` if `entityNameById`
 * carries the target's name. Otherwise the reference falls back to the
 * raw UUID followed by an HTML comment (`<!-- id: <uuid> -->`) so the
 * id survives a round trip even when names cannot be resolved.
 *
 * No DB, no React, no I/O — this module is trivially unit-testable.
 */
import type { EntityType } from '../db/schema'
import type { NpcStatus } from './npc'
import type { BondTargetType } from './bonds'

// ─── Local row types (structural, wire-format-compatible) ───────────────────
//
// Defined here so this module compiles in both the app build (which has
// `src/`) and the server build (which doesn't include `src/`). They
// match the wire-format Row types in `src/api/*` — dates as ISO strings.

export type ExportEdge = {
  id: string
  sourceType: EntityType
  sourceId: string
  targetType: EntityType
  targetId: string
  kind: string
  notes: string | null
  // ISO string in the wire format; not emitted by the serializer.
  createdAt: string
}

export type ExportPc = {
  id: string
  name: string
  description: string | null
  profession: string | null
  str: number
  con: number
  dex: number
  intelligence: number
  pow: number
  cha: number
  hp: number
  wp: number
  bp: number
  sanMax: number
  skills: Array<{ name: string; rating: number }> | null
  motivations: string[] | null
  backstoryHooks: string | null
  sanityCurrent: number | null
  sanityDisorders: string[] | null
  breakingPoints: number[] | null
  adaptedTo: string[] | null
}

export type ExportNpc = {
  id: string
  name: string
  description: string | null
  factionId: string | null
  profession: string | null
  str: number | null
  con: number | null
  dex: number | null
  intelligence: number | null
  pow: number | null
  cha: number | null
  hp: number | null
  wp: number | null
  mannerisms: string | null
  voice: string | null
  secrets: string | null
  status: NpcStatus
  locationId: string | null
  currentGoal: string | null
}

export type ExportClue = {
  id: string
  name: string
  description: string | null
  originScenarioId: string | null
}

export type ExportFaction = {
  id: string
  name: string
  description: string | null
  agenda: string | null
}

export type ExportLocation = {
  id: string
  parentLocationId: string | null
  name: string
  description: string | null
}

export type ExportItem = {
  id: string
  name: string
  description: string | null
  history: string | null
  ownerNpcId: string | null
  locationId: string | null
}

export type ExportSession = {
  id: string
  name: string
  description: string | null
  inGameDate: string | null
  inGameDateEnd: string | null
  realWorldDate: string | null
}

export type ExportScenario = {
  id: string
  name: string
  description: string | null
}

export type ExportScene = {
  id: string
  scenarioId: string
  name: string
  description: string | null
  orderIndex: number
}

export type ExportBondRow = {
  id: string
  name: string
  currentScore: number
  maxScore: number
  targetType: BondTargetType
  targetId: string
  description: string | null
}

export type ExportBondDamageEvent = {
  id: string
  delta: number
  reason: string | null
  sessionId: string | null
  // ISO string — kept; the event row itself is the data.
  appliedAt: string
}

export type ExportBondWithEvents = {
  bond: ExportBondRow
  events: ExportBondDamageEvent[]
}

export type ExportSanEvent = {
  id: string
  delta: number
  source: string
  sessionId: string | null
  crossedThresholds: number[] | null
  appliedAt: string
}

export type ExportNameMap = Record<string, string>

export type ExportInput =
  | {
      kind: 'pc'
      pc: ExportPc
      bonds?: ExportBondWithEvents[]
      sanEvents?: ExportSanEvent[]
      outgoingEdges?: ExportEdge[]
      incomingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'npc'
      npc: ExportNpc
      outgoingEdges?: ExportEdge[]
      incomingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'clue'
      clue: ExportClue
      outgoingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'faction'
      faction: ExportFaction
      outgoingEdges?: ExportEdge[]
      incomingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'location'
      location: ExportLocation
      outgoingEdges?: ExportEdge[]
      incomingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'item'
      item: ExportItem
      outgoingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'session'
      session: ExportSession
      outgoingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'scenario'
      scenario: ExportScenario
      outgoingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }
  | {
      kind: 'scene'
      scene: ExportScene
      outgoingEdges?: ExportEdge[]
      incomingEdges?: ExportEdge[]
      entityNameById?: ExportNameMap
    }

// ─── Public API ─────────────────────────────────────────────────────────────

export function serializeEntity(input: ExportInput): string {
  switch (input.kind) {
    case 'pc':
      return serializePc(input)
    case 'npc':
      return serializeNpc(input)
    case 'clue':
      return serializeClue(input)
    case 'faction':
      return serializeFaction(input)
    case 'location':
      return serializeLocation(input)
    case 'item':
      return serializeItem(input)
    case 'session':
      return serializeSession(input)
    case 'scenario':
      return serializeScenario(input)
    case 'scene':
      return serializeScene(input)
  }
}

/**
 * Slugifies an entity name for use in the export filename. Lowercase,
 * ASCII-fold what we can, hyphenate, strip dangerous chars. Falls back
 * to "untitled" if the result is empty.
 */
export function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.length > 0 ? slug : 'untitled'
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type Line = string

class Doc {
  private readonly lines: Line[] = []

  push(line: Line): void {
    this.lines.push(line)
  }

  blank(): void {
    if (this.lines.length === 0) return
    if (this.lines[this.lines.length - 1] === '') return
    this.lines.push('')
  }

  toString(): string {
    // Trim trailing blank lines, then guarantee exactly one trailing \n.
    let end = this.lines.length
    while (end > 0 && this.lines[end - 1] === '') end--
    return this.lines.slice(0, end).join('\n') + '\n'
  }
}

function field(label: string, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const s = typeof value === 'string' ? value : String(value)
  if (s === '') return null
  return `- **${label}**: ${s}`
}

function refLink(_targetType: string, targetId: string, names: ExportNameMap | undefined): string {
  const name = names?.[targetId]
  if (name && name.length > 0) return `[[${name}]]`
  // Fall back to raw id + html comment so the id survives a round trip.
  return `${targetId} <!-- id: ${targetId} -->`
}

/**
 * Stable comparator for edges. Sort by:
 *   1. kind (lex)
 *   2. targetType / sourceType (lex)
 *   3. resolved target/source name (lex), with id as tiebreaker
 */
function edgeSortKey(e: ExportEdge, side: 'out' | 'in', names: ExportNameMap | undefined): string {
  if (side === 'out') {
    const name = names?.[e.targetId] ?? e.targetId
    return `${e.kind} ${e.targetType} ${name} ${e.targetId}`
  }
  const name = names?.[e.sourceId] ?? e.sourceId
  return `${e.kind} ${e.sourceType} ${name} ${e.sourceId}`
}

function sortedEdges(
  edges: ExportEdge[],
  side: 'out' | 'in',
  names: ExportNameMap | undefined,
): ExportEdge[] {
  return [...edges].sort((a, b) =>
    edgeSortKey(a, side, names).localeCompare(edgeSortKey(b, side, names)),
  )
}

function emitEdges(
  doc: Doc,
  heading: string,
  edges: ExportEdge[] | undefined,
  side: 'out' | 'in',
  names: ExportNameMap | undefined,
): void {
  if (!edges || edges.length === 0) return
  doc.blank()
  doc.push(`## ${heading}`)
  for (const e of sortedEdges(edges, side, names)) {
    if (side === 'out') {
      const target = refLink(e.targetType, e.targetId, names)
      const notes = e.notes ? ` — ${e.notes}` : ''
      doc.push(`- **${e.kind}** → (${e.targetType}) ${target}${notes}`)
    } else {
      const source = refLink(e.sourceType, e.sourceId, names)
      const notes = e.notes ? ` — ${e.notes}` : ''
      doc.push(`- **${e.kind}** ← (${e.sourceType}) ${source}${notes}`)
    }
  }
}

// ─── PC ─────────────────────────────────────────────────────────────────────

function serializePc(input: Extract<ExportInput, { kind: 'pc' }>): string {
  const { pc, bonds, sanEvents, outgoingEdges, incomingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# PC: ${pc.name}`)
  doc.blank()
  pushIfPresent(doc, field('Profession', pc.profession))
  pushIfPresent(doc, field('Description', pc.description))

  // ─── Stats ──────────────────────────────────────────────────────────────
  doc.blank()
  doc.push('## Stats')
  doc.push(field('STR', pc.str)!)
  doc.push(field('CON', pc.con)!)
  doc.push(field('DEX', pc.dex)!)
  doc.push(field('INT', pc.intelligence)!)
  doc.push(field('POW', pc.pow)!)
  doc.push(field('CHA', pc.cha)!)

  // ─── Derived ────────────────────────────────────────────────────────────
  doc.blank()
  doc.push('## Derived')
  doc.push(field('HP', pc.hp)!)
  doc.push(field('WP', pc.wp)!)
  doc.push(field('Breaking Point', pc.bp)!)
  doc.push(field('SAN max', pc.sanMax)!)

  // ─── Skills (sorted alphabetically) ─────────────────────────────────────
  const skills = [...(pc.skills ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  if (skills.length > 0) {
    doc.blank()
    doc.push('## Skills')
    for (const s of skills) {
      doc.push(`- **${s.name}**: ${s.rating}`)
    }
  }

  // ─── Motivations (sorted) ───────────────────────────────────────────────
  const motivations = [...(pc.motivations ?? [])].sort((a, b) => a.localeCompare(b))
  if (motivations.length > 0) {
    doc.blank()
    doc.push('## Motivations')
    for (const m of motivations) {
      doc.push(`- ${m}`)
    }
  }

  // ─── Backstory hooks ────────────────────────────────────────────────────
  if (pc.backstoryHooks) {
    doc.blank()
    doc.push('## Backstory hooks')
    doc.push(pc.backstoryHooks)
  }

  // ─── Sanity ─────────────────────────────────────────────────────────────
  doc.blank()
  doc.push('## Sanity')
  doc.push(field('Current', pc.sanityCurrent ?? pc.sanMax)!)
  doc.push(field('Max', pc.sanMax)!)
  // Breaking points are deliberately preserved in input order — they are
  // ordered SAN thresholds (POW × 4, × 3, × 2, POW), not a free-form list.
  const bps = pc.breakingPoints ?? []
  if (bps.length > 0) {
    doc.push(`- **Breaking points**: ${bps.join(', ')}`)
  }
  const disorders = [...(pc.sanityDisorders ?? [])].sort((a, b) => a.localeCompare(b))
  if (disorders.length > 0) {
    doc.push(`- **Disorders**: ${disorders.join(', ')}`)
  }
  const adapted = [...(pc.adaptedTo ?? [])].sort((a, b) => a.localeCompare(b))
  if (adapted.length > 0) {
    doc.push(`- **Adapted to**: ${adapted.join(', ')}`)
  }

  // ─── Bonds ──────────────────────────────────────────────────────────────
  if (bonds && bonds.length > 0) {
    const sortedBonds = [...bonds].sort(
      (a, b) => a.bond.name.localeCompare(b.bond.name) || a.bond.id.localeCompare(b.bond.id),
    )
    doc.blank()
    doc.push('## Bonds')
    for (const b of sortedBonds) {
      emitBond(doc, b.bond, b.events, entityNameById)
    }
  }

  // ─── SAN history ────────────────────────────────────────────────────────
  if (sanEvents && sanEvents.length > 0) {
    const sortedEvents = [...sanEvents].sort(
      (a, b) => a.appliedAt.localeCompare(b.appliedAt) || a.id.localeCompare(b.id),
    )
    doc.blank()
    doc.push('## SAN history')
    for (const ev of sortedEvents) {
      const sign = ev.delta > 0 ? `+${ev.delta}` : `${ev.delta}`
      const sess = ev.sessionId ? ` · session ${ev.sessionId}` : ''
      const crossed =
        ev.crossedThresholds && ev.crossedThresholds.length > 0
          ? ` · crossed ${ev.crossedThresholds.join(', ')}`
          : ''
      doc.push(`- **${sign}** — ${ev.source}${sess}${crossed} · ${ev.appliedAt}`)
    }
  }

  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  emitEdges(doc, 'Incoming relationships', incomingEdges, 'in', entityNameById)

  return doc.toString()
}

function emitBond(
  doc: Doc,
  bond: ExportBondRow,
  events: ExportBondDamageEvent[],
  names: ExportNameMap | undefined,
): void {
  doc.push(`### ${bond.name}`)
  doc.push(`- **Score**: ${bond.currentScore} / ${bond.maxScore}`)
  doc.push(`- **Target**: (${bond.targetType}) ${refLink(bond.targetType, bond.targetId, names)}`)
  if (bond.description) {
    doc.push(`- **Description**: ${bond.description}`)
  }
  if (events.length > 0) {
    const sorted = [...events].sort(
      (a, b) => a.appliedAt.localeCompare(b.appliedAt) || a.id.localeCompare(b.id),
    )
    doc.push('- **History**:')
    for (const ev of sorted) {
      const sign = ev.delta > 0 ? `+${ev.delta}` : `${ev.delta}`
      const reason = ev.reason ? ` — ${ev.reason}` : ''
      const sess = ev.sessionId ? ` · session ${ev.sessionId}` : ''
      doc.push(`  - **${sign}**${reason}${sess} · ${ev.appliedAt}`)
    }
  }
}

// ─── NPC ────────────────────────────────────────────────────────────────────

function serializeNpc(input: Extract<ExportInput, { kind: 'npc' }>): string {
  const { npc, outgoingEdges, incomingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# NPC: ${npc.name}`)
  doc.blank()
  pushIfPresent(doc, field('Profession', npc.profession))
  doc.push(field('Status', npc.status)!)
  if (npc.factionId) {
    doc.push(`- **Faction**: ${refLink('faction', npc.factionId, entityNameById)}`)
  }
  if (npc.locationId) {
    doc.push(`- **Location**: ${refLink('location', npc.locationId, entityNameById)}`)
  }
  pushIfPresent(doc, field('Description', npc.description))

  // ─── Stat block ─────────────────────────────────────────────────────────
  const hasFullStats =
    npc.str !== null &&
    npc.con !== null &&
    npc.dex !== null &&
    npc.intelligence !== null &&
    npc.pow !== null &&
    npc.cha !== null
  doc.blank()
  doc.push('## Stat block')
  if (hasFullStats) {
    doc.push(field('STR', npc.str)!)
    doc.push(field('CON', npc.con)!)
    doc.push(field('DEX', npc.dex)!)
    doc.push(field('INT', npc.intelligence)!)
    doc.push(field('POW', npc.pow)!)
    doc.push(field('CHA', npc.cha)!)
  } else {
    doc.push('Simplified.')
  }
  pushIfPresent(doc, field('HP', npc.hp))
  pushIfPresent(doc, field('WP', npc.wp))

  // ─── RP hooks ───────────────────────────────────────────────────────────
  if (npc.mannerisms || npc.voice || npc.secrets || npc.currentGoal) {
    doc.blank()
    doc.push('## RP hooks')
    pushIfPresent(doc, field('Mannerisms', npc.mannerisms))
    pushIfPresent(doc, field('Voice', npc.voice))
    pushIfPresent(doc, field('Secrets', npc.secrets))
    pushIfPresent(doc, field('Current goal', npc.currentGoal))
  }

  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  emitEdges(doc, 'Incoming relationships', incomingEdges, 'in', entityNameById)

  return doc.toString()
}

// ─── Clue ───────────────────────────────────────────────────────────────────

function serializeClue(input: Extract<ExportInput, { kind: 'clue' }>): string {
  const { clue, outgoingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# Clue: ${clue.name}`)
  doc.blank()
  pushIfPresent(doc, field('Description', clue.description))
  if (clue.originScenarioId) {
    doc.push(`- **Origin scenario**: ${refLink('scenario', clue.originScenarioId, entityNameById)}`)
  }
  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  return doc.toString()
}

// ─── Faction ────────────────────────────────────────────────────────────────

function serializeFaction(input: Extract<ExportInput, { kind: 'faction' }>): string {
  const { faction, outgoingEdges, incomingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# Faction: ${faction.name}`)
  doc.blank()
  pushIfPresent(doc, field('Description', faction.description))
  pushIfPresent(doc, field('Agenda', faction.agenda))
  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  emitEdges(doc, 'Incoming relationships', incomingEdges, 'in', entityNameById)
  return doc.toString()
}

// ─── Location ───────────────────────────────────────────────────────────────

function serializeLocation(input: Extract<ExportInput, { kind: 'location' }>): string {
  const { location, outgoingEdges, incomingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# Location: ${location.name}`)
  doc.blank()
  pushIfPresent(doc, field('Description', location.description))
  if (location.parentLocationId) {
    doc.push(`- **Parent**: ${refLink('location', location.parentLocationId, entityNameById)}`)
  }
  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  emitEdges(doc, 'Incoming relationships', incomingEdges, 'in', entityNameById)
  return doc.toString()
}

// ─── Item ───────────────────────────────────────────────────────────────────

function serializeItem(input: Extract<ExportInput, { kind: 'item' }>): string {
  const { item, outgoingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# Item: ${item.name}`)
  doc.blank()
  pushIfPresent(doc, field('Description', item.description))
  if (item.ownerNpcId) {
    doc.push(`- **Owner**: ${refLink('npc', item.ownerNpcId, entityNameById)}`)
  }
  if (item.locationId) {
    doc.push(`- **Location**: ${refLink('location', item.locationId, entityNameById)}`)
  }
  if (item.history) {
    doc.blank()
    doc.push('## History')
    doc.push(item.history)
  }
  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  return doc.toString()
}

// ─── Session ────────────────────────────────────────────────────────────────

function serializeSession(input: Extract<ExportInput, { kind: 'session' }>): string {
  const { session, outgoingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# Session: ${session.name}`)
  doc.blank()
  pushIfPresent(doc, field('Description', session.description))
  pushIfPresent(doc, field('In-game date', session.inGameDate))
  pushIfPresent(doc, field('In-game date end', session.inGameDateEnd))
  pushIfPresent(doc, field('Real-world date', session.realWorldDate))
  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  return doc.toString()
}

// ─── Scenario ───────────────────────────────────────────────────────────────

function serializeScenario(input: Extract<ExportInput, { kind: 'scenario' }>): string {
  const { scenario, outgoingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# Scenario: ${scenario.name}`)
  doc.blank()
  pushIfPresent(doc, field('Description', scenario.description))
  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  return doc.toString()
}

// ─── Scene ──────────────────────────────────────────────────────────────────

function serializeScene(input: Extract<ExportInput, { kind: 'scene' }>): string {
  const { scene, outgoingEdges, incomingEdges, entityNameById } = input
  const doc = new Doc()
  doc.push(`# Scene: ${scene.name}`)
  doc.blank()
  doc.push(field('Order', scene.orderIndex)!)
  if (scene.scenarioId) {
    doc.push(`- **Scenario**: ${refLink('scenario', scene.scenarioId, entityNameById)}`)
  }
  pushIfPresent(doc, field('Description', scene.description))
  emitEdges(doc, 'Outgoing relationships', outgoingEdges, 'out', entityNameById)
  emitEdges(doc, 'Incoming relationships', incomingEdges, 'in', entityNameById)
  return doc.toString()
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function pushIfPresent(doc: Doc, line: string | null): void {
  if (line !== null) doc.push(line)
}
