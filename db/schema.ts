import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * The eleven canonical entity types referenced by polymorphic edges.
 * Keep in sync with `entityTypes` const below — used as a runtime guard
 * for edge `source_type`/`target_type` columns.
 */
export const ENTITY_TYPES = [
  'campaign',
  'scenario',
  'scene',
  'npc',
  'pc',
  'clue',
  'item',
  'faction',
  'location',
  'session',
  'bond',
] as const

export type EntityType = (typeof ENTITY_TYPES)[number]

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)

export const meta = sqliteTable('_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: updatedAt(),
})

// ─── Entity tables ──────────────────────────────────────────────────────────
// Minimal fields for #004. Domain-specific fields land in dedicated issues:
//   #005 PC RAW fields, #006 NPC fields, #010 Clue provenance, #011 Bond log,
//   #013 Session timeline, #020 Faction status timeline.

export const campaigns = sqliteTable('campaigns', {
  id: id(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const scenarios = sqliteTable('scenarios', {
  id: id(),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const scenes = sqliteTable('scenes', {
  id: id(),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => scenarios.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const pcs = sqliteTable('pcs', {
  id: id(),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  // ─── DG RAW fields (#005) ───────────────────────────────────────────────
  profession: text('profession'),
  // Base statistics (1–18 at character creation; validated in domain/pc.ts).
  str: integer('str').notNull().default(10),
  con: integer('con').notNull().default(10),
  dex: integer('dex').notNull().default(10),
  intelligence: integer('intelligence').notNull().default(10),
  pow: integer('pow').notNull().default(10),
  cha: integer('cha').notNull().default(10),
  // Derived attributes — recomputed by the API on every write via
  // domain/pc.ts#deriveAttributes. Stored for query convenience.
  hp: integer('hp').notNull().default(0),
  wp: integer('wp').notNull().default(0),
  bp: integer('bp').notNull().default(0),
  sanMax: integer('san_max').notNull().default(0),
  // Skills as JSON: Array<{ name: string; rating: number }>.
  skills: text('skills', { mode: 'json' }).$type<Array<{ name: string; rating: number }>>(),
  // Motivations as JSON: string[].
  motivations: text('motivations', { mode: 'json' }).$type<string[]>(),
  backstoryHooks: text('backstory_hooks'),
  // SAN block stubs — full mechanics in M2 (#011/#012).
  sanityCurrent: integer('sanity_current'),
  sanityDisorders: text('sanity_disorders', { mode: 'json' }).$type<string[]>(),
  breakingPoints: text('breaking_points', { mode: 'json' }).$type<string[]>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const npcs = sqliteTable('npcs', {
  id: id(),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  factionId: text('faction_id'),
  // ─── NPC fields (#006) ──────────────────────────────────────────────────
  profession: text('profession'),
  // Base stats — nullable since simplified NPCs only carry HP/WP. When
  // present, validated 1–18 by domain/npc.ts via pcStatsSchema.
  str: integer('str'),
  con: integer('con'),
  dex: integer('dex'),
  intelligence: integer('intelligence'),
  pow: integer('pow'),
  cha: integer('cha'),
  // HP/WP — derived from full stats via domain/pc.ts#deriveAttributes when
  // a full block is supplied; written through directly for simplified NPCs.
  hp: integer('hp'),
  wp: integer('wp'),
  // RP hooks — the four continuity dimensions surface these on the
  // detail page.
  mannerisms: text('mannerisms'),
  voice: text('voice'),
  secrets: text('secrets'),
  // Status: 'alive' | 'dead' | 'missing' | 'turned'. Enforced in the
  // domain layer (Zod) — SQLite has no native enum.
  status: text('status').notNull().default('alive'),
  // Location reference; FK wiring lands with Locations in #008.
  locationId: text('location_id'),
  currentGoal: text('current_goal'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const clues = sqliteTable('clues', {
  id: id(),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const items = sqliteTable('items', {
  id: id(),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  ownerNpcId: text('owner_npc_id'),
  locationId: text('location_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const factions = sqliteTable('factions', {
  id: id(),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const locations = sqliteTable('locations', {
  id: id(),
  campaignId: text('campaign_id').references(() => campaigns.id, {
    onDelete: 'cascade',
  }),
  parentLocationId: text('parent_location_id'),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const sessions = sqliteTable('sessions', {
  id: id(),
  campaignId: text('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  inGameDate: text('in_game_date'),
  realWorldDate: integer('real_world_date', { mode: 'timestamp' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const bonds = sqliteTable('bonds', {
  id: id(),
  pcId: text('pc_id')
    .notNull()
    .references(() => pcs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  score: integer('score').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// ─── Polymorphic edges (ADR-002) ────────────────────────────────────────────
// One row per typed relationship. Source/target are (entity_type, entity_id)
// pairs — referential integrity is enforced at the application layer, not
// the DB. Indexes on (source_type, source_id) and (target_type, target_id)
// keep reverse-ref lookups O(log n).

export const edges = sqliteTable(
  'edges',
  {
    id: id(),
    sourceType: text('source_type').notNull().$type<EntityType>(),
    sourceId: text('source_id').notNull(),
    targetType: text('target_type').notNull().$type<EntityType>(),
    targetId: text('target_id').notNull(),
    kind: text('kind').notNull(),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  (table) => [
    index('idx_edges_source').on(table.sourceType, table.sourceId),
    index('idx_edges_target').on(table.targetType, table.targetId),
    index('idx_edges_kind').on(table.kind),
  ],
)

// ─── Inferred types ─────────────────────────────────────────────────────────

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
export type Scenario = typeof scenarios.$inferSelect
export type NewScenario = typeof scenarios.$inferInsert
export type Scene = typeof scenes.$inferSelect
export type NewScene = typeof scenes.$inferInsert
export type PC = typeof pcs.$inferSelect
export type NewPC = typeof pcs.$inferInsert
export type NPC = typeof npcs.$inferSelect
export type NewNPC = typeof npcs.$inferInsert
export type Clue = typeof clues.$inferSelect
export type NewClue = typeof clues.$inferInsert
export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type Faction = typeof factions.$inferSelect
export type NewFaction = typeof factions.$inferInsert
export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Bond = typeof bonds.$inferSelect
export type NewBond = typeof bonds.$inferInsert
export type Edge = typeof edges.$inferSelect
export type NewEdge = typeof edges.$inferInsert
export type Meta = typeof meta.$inferSelect
export type NewMeta = typeof meta.$inferInsert
