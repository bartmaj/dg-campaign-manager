import { createClient, type Client as LibsqlClient } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'

export { schema }
export type Schema = typeof schema
export type DB = LibSQLDatabase<Schema>

// Lazy init so a missing/invalid env var doesn't crash module load — Vercel
// turns module-load throws into opaque FUNCTION_INVOCATION_FAILED, which is
// undebuggable. By deferring to first use, the dispatcher's try/catch can
// surface a real error message.
let _libsql: LibsqlClient | null = null
let _db: DB | null = null

function getDb(): DB {
  if (_db) return _db
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DB env missing: set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN for production) or DATABASE_URL for local dev',
    )
  }
  _libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  _db = drizzle(_libsql, { schema })
  return _db
}

// Proxy preserves the existing `import { db } from './client'` API while
// deferring the actual client creation until the first property access.
export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = getDb()
    const value = Reflect.get(real as object, prop, receiver)
    return typeof value === 'function' ? value.bind(real) : value
  },
}) as DB
