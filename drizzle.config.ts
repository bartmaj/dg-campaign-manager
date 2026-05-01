import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) {
  throw new Error('Set DATABASE_URL or TURSO_DATABASE_URL in .env')
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  strict: true,
  verbose: true,
})
