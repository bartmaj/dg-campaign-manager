import 'dotenv/config'
import { db, schema } from '../db/client'

async function main() {
  await db
    .insert(schema.meta)
    .values({ key: 'schema_version', value: '0.1.0' })
    .onConflictDoUpdate({
      target: schema.meta.key,
      set: { value: '0.1.0' },
    })

  console.log('Seeded representative dev fixtures.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
