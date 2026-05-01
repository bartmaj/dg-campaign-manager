import 'dotenv/config'
import { db, schema } from '../db/client'

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL
  console.log(`Connecting to: ${url}`)
  const rows = await db.select().from(schema.meta).limit(1)
  console.log(`OK — _meta has ${rows.length} row(s)`)
}

main().catch((err) => {
  console.error('DB status check failed:', err)
  process.exit(1)
})
