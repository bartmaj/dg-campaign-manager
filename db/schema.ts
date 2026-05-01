import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Schema scaffold for #003. Real entity tables (PC, NPC, Faction, etc.) land in #004.
 * The `_meta` table exists to validate the migration pipeline end-to-end.
 */
export const meta = sqliteTable('_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type Meta = typeof meta.$inferSelect
export type NewMeta = typeof meta.$inferInsert
