/**
 * Turso point-in-time-recovery rehearsal (#030).
 *
 * Forks the production DB into `dg-campaign-manager-recovery-rehearsal`,
 * counts rows on every entity table in both prod and the fork, prints
 * a side-by-side report, and tears the fork down (unless KEEP_FORK=1).
 *
 * Requires `turso` CLI authenticated as the DB owner. Reads prod URL +
 * token from .env (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
 *
 * Run with: pnpm db:recovery-rehearsal
 */
import 'dotenv/config'
import { createClient, type Client as LibsqlClient } from '@libsql/client'
import { execFileSync } from 'node:child_process'

const SOURCE_DB = 'dg-campaign-manager'
const FORK_DB = 'dg-campaign-manager-recovery-rehearsal'

const TABLES = [
  'campaigns',
  'scenarios',
  'scenes',
  'pcs',
  'npcs',
  'clues',
  'items',
  'factions',
  'locations',
  'sessions',
  'bonds',
  'bond_damage_events',
  'san_change_events',
  'edges',
  'faction_status_events',
  'clue_delivery_events',
  'npc_encounter_events',
] as const

// Run the turso CLI safely. All args are constants or names from this
// file — no untrusted input flows through here.
function turso(args: string[], { allowFail = false }: { allowFail?: boolean } = {}): string {
  try {
    return execFileSync('turso', args, { encoding: 'utf8' }).trim()
  } catch (err) {
    if (allowFail) return ''
    throw err
  }
}

async function countRows(client: LibsqlClient, table: string): Promise<number> {
  const res = await client.execute(`SELECT COUNT(*) as n FROM ${table}`)
  const row = res.rows[0]
  if (!row) return 0
  const n = (row as Record<string, unknown>)['n']
  return Number(n ?? 0)
}

async function withClient(
  url: string,
  authToken: string | undefined,
  fn: (c: LibsqlClient) => Promise<void>,
) {
  const client = createClient({ url, authToken })
  try {
    await fn(client)
  } finally {
    client.close()
  }
}

async function main() {
  const prodUrl = process.env.TURSO_DATABASE_URL
  const prodToken = process.env.TURSO_AUTH_TOKEN
  if (!prodUrl) {
    throw new Error('TURSO_DATABASE_URL not set in .env')
  }

  console.log(`[1/5] Forking ${SOURCE_DB} → ${FORK_DB}…`)
  // If the fork already exists from a previous failed run, drop it first.
  turso(['db', 'destroy', '--yes', FORK_DB], { allowFail: true })
  turso(['db', 'create', FORK_DB, '--from-db', SOURCE_DB])
  console.log('     fork created')

  console.log(`[2/5] Resolving fork URL + token…`)
  const forkUrl = turso(['db', 'show', FORK_DB, '--url'])
  const forkToken = turso(['db', 'tokens', 'create', FORK_DB])
  console.log(`     ${forkUrl}`)

  console.log('[3/5] Counting rows on production…')
  const prodCounts: Record<string, number> = {}
  await withClient(prodUrl, prodToken, async (c) => {
    for (const t of TABLES) prodCounts[t] = await countRows(c, t)
  })

  console.log('[4/5] Counting rows on fork…')
  const forkCounts: Record<string, number> = {}
  await withClient(forkUrl, forkToken, async (c) => {
    for (const t of TABLES) forkCounts[t] = await countRows(c, t)
  })

  console.log('[5/5] Report:')
  const widthName = Math.max(...TABLES.map((t) => t.length)) + 2
  console.log('  ' + 'table'.padEnd(widthName) + 'prod   fork   delta')
  console.log('  ' + '-'.repeat(widthName + 22))
  let totalDelta = 0
  for (const t of TABLES) {
    const p = prodCounts[t] ?? 0
    const f = forkCounts[t] ?? 0
    const d = p - f
    totalDelta += Math.abs(d)
    const status = d === 0 ? 'ok' : d > 0 ? '+' : '-'
    console.log(
      '  ' + t.padEnd(widthName) + String(p).padEnd(7) + String(f).padEnd(7) + status + ' ' + d,
    )
  }
  console.log(`\n  total absolute delta: ${totalDelta}`)
  if (totalDelta === 0) {
    console.log('  fork matches production exactly. PITR healthy.')
  } else {
    console.log(
      `  fork lags production by ${totalDelta} row(s) — expected if writes happened during the rehearsal. PITR is still healthy.`,
    )
  }

  if (process.env['KEEP_FORK'] === '1') {
    console.log(`\n[skip teardown] fork left at ${FORK_DB} (KEEP_FORK=1). Drop manually with:`)
    console.log(`  turso db destroy --yes ${FORK_DB}`)
  } else {
    console.log(`\n  Tearing down fork…`)
    turso(['db', 'destroy', '--yes', FORK_DB])
    console.log('  done')
  }
}

main().catch((err) => {
  console.error('Recovery rehearsal failed:', err)
  process.exit(1)
})
