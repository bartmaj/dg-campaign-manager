/**
 * Campaign-wide Markdown archive (#029, REQ-018).
 *
 * Walks every entity reachable from the campaign, runs each row through
 * `serializeEntity` (the same serializer the per-entity export endpoints
 * use), and packages the resulting Markdown files into a single
 * in-memory ZIP.
 *
 * ## Determinism
 *
 * - Files are added in alphabetical order by their archive path.
 * - Each ZIP entry's date is pinned to the Unix epoch (1970-01-01) so
 *   re-running an export over the same campaign produces a byte-for-byte
 *   identical archive. JSZip exposes the per-entry `date` option for
 *   exactly this purpose.
 * - The serializer itself is already deterministic (REQ-N04).
 *
 * ## Caps
 *
 * Each entity table is hard-capped at MAX_ROWS_PER_TYPE rows to keep the
 * single Vercel serverless invocation within memory + time budgets.
 * Beyond that, we 413 with a JSON error. TODO(streaming): for larger
 * campaigns, switch to streamed multipart with per-entity chunks and
 * drop the in-memory ZIP buffer.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, eq, inArray } from 'drizzle-orm'
import JSZip from 'jszip'
import { db, schema } from '../../db/client.js'
import type { NpcStatus } from '../../domain/npc.js'
import { serializeEntity, slugifyName } from '../../domain/mdExport.js'
import { loadEdgeContext, toExportEdges } from '../_lib/export.js'

const MAX_ROWS_PER_TYPE = 1000

type ArchiveFile = { path: string; body: string }

// Pinned epoch — jszip writes this into the central directory record per
// entry, so a deterministic date here makes the whole ZIP byte-stable.
const EPOCH = new Date(0)

/**
 * Resolve the target campaign(s):
 *   - `id === 'all'` → no filter, dump every row of every type.
 *   - otherwise → filter by `campaignId === id` where the table has it,
 *     and trace bonds / events through their parent PC / NPC.
 *
 * Returns `null` when the campaign id is given but doesn't exist.
 */
async function resolveCampaign(
  id: string,
): Promise<{ mode: 'all'; name: string } | { mode: 'one'; id: string; name: string } | null> {
  if (id === 'all') {
    // Pick a stable archive name. If there's exactly one campaign use its
    // name; otherwise fall back to a generic label.
    const all = await db.select().from(schema.campaigns).orderBy(asc(schema.campaigns.createdAt))
    const name = all.length === 1 && all[0] ? all[0].name : 'campaign'
    return { mode: 'all', name }
  }
  const [row] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id)).limit(1)
  if (!row) return null
  return { mode: 'one', id, name: row.name }
}

/**
 * Build the list of archive files. Each entry is one Markdown document.
 * The function does no I/O on the response — it returns the materialized
 * file list so the caller can sort, validate, and zip them.
 */
async function buildArchiveFiles(
  campaignId: string | undefined,
): Promise<{ files: ArchiveFile[]; counts: Record<string, number> }> {
  // ─── Fetch every relevant table in parallel ──────────────────────────
  const [pcs, npcs, clues, factions, locations, items, sessions, scenarios, scenes] =
    await Promise.all([
      campaignId
        ? db.select().from(schema.pcs).where(eq(schema.pcs.campaignId, campaignId))
        : db.select().from(schema.pcs),
      campaignId
        ? db.select().from(schema.npcs).where(eq(schema.npcs.campaignId, campaignId))
        : db.select().from(schema.npcs),
      campaignId
        ? db.select().from(schema.clues).where(eq(schema.clues.campaignId, campaignId))
        : db.select().from(schema.clues),
      campaignId
        ? db.select().from(schema.factions).where(eq(schema.factions.campaignId, campaignId))
        : db.select().from(schema.factions),
      campaignId
        ? db.select().from(schema.locations).where(eq(schema.locations.campaignId, campaignId))
        : db.select().from(schema.locations),
      campaignId
        ? db.select().from(schema.items).where(eq(schema.items.campaignId, campaignId))
        : db.select().from(schema.items),
      campaignId
        ? db.select().from(schema.sessions).where(eq(schema.sessions.campaignId, campaignId))
        : db.select().from(schema.sessions),
      campaignId
        ? db.select().from(schema.scenarios).where(eq(schema.scenarios.campaignId, campaignId))
        : db.select().from(schema.scenarios),
      // Scenes have no campaignId column — they trace via scenarioId.
      campaignId
        ? (async () => {
            const scenIds = await db
              .select({ id: schema.scenarios.id })
              .from(schema.scenarios)
              .where(eq(schema.scenarios.campaignId, campaignId))
            if (scenIds.length === 0) return []
            return db
              .select()
              .from(schema.scenes)
              .where(
                inArray(
                  schema.scenes.scenarioId,
                  scenIds.map((s) => s.id),
                ),
              )
          })()
        : db.select().from(schema.scenes),
    ])

  // ─── Cap enforcement ─────────────────────────────────────────────────
  for (const [type, rows] of [
    ['pc', pcs],
    ['npc', npcs],
    ['clue', clues],
    ['faction', factions],
    ['location', locations],
    ['item', items],
    ['session', sessions],
    ['scenario', scenarios],
    ['scene', scenes],
  ] as const) {
    if (rows.length > MAX_ROWS_PER_TYPE) {
      throw new ArchiveTooLarge(type, rows.length)
    }
  }

  const files: ArchiveFile[] = []

  // ─── PCs (with bonds + sanity events) ────────────────────────────────
  await Promise.all(
    pcs.map(async (pc) => {
      const [bondRows, sanEvents, edgeCtx] = await Promise.all([
        db.select().from(schema.bonds).where(eq(schema.bonds.pcId, pc.id)),
        db
          .select()
          .from(schema.sanChangeEvents)
          .where(eq(schema.sanChangeEvents.pcId, pc.id))
          .orderBy(asc(schema.sanChangeEvents.appliedAt)),
        loadEdgeContext('pc', pc.id),
      ])
      const bondsWithEvents = await Promise.all(
        bondRows.map(async (bond) => {
          const events = await db
            .select()
            .from(schema.bondDamageEvents)
            .where(eq(schema.bondDamageEvents.bondId, bond.id))
            .orderBy(asc(schema.bondDamageEvents.appliedAt))
          return {
            bond: {
              id: bond.id,
              name: bond.name,
              currentScore: bond.currentScore,
              maxScore: bond.maxScore,
              targetType: bond.targetType as 'npc' | 'pc',
              targetId: bond.targetId,
              description: bond.description,
            },
            events: events.map((ev) => ({
              id: ev.id,
              delta: ev.delta,
              reason: ev.reason,
              sessionId: ev.sessionId,
              appliedAt:
                ev.appliedAt instanceof Date ? ev.appliedAt.toISOString() : String(ev.appliedAt),
            })),
          }
        }),
      )
      const md = serializeEntity({
        kind: 'pc',
        pc: {
          id: pc.id,
          name: pc.name,
          description: pc.description,
          profession: pc.profession,
          str: pc.str,
          con: pc.con,
          dex: pc.dex,
          intelligence: pc.intelligence,
          pow: pc.pow,
          cha: pc.cha,
          hp: pc.hp,
          wp: pc.wp,
          bp: pc.bp,
          sanMax: pc.sanMax,
          skills: pc.skills ?? null,
          motivations: pc.motivations ?? null,
          backstoryHooks: pc.backstoryHooks,
          sanityCurrent: pc.sanityCurrent,
          sanityDisorders: pc.sanityDisorders ?? null,
          breakingPoints: pc.breakingPoints ?? null,
          adaptedTo: pc.adaptedTo ?? null,
        },
        bonds: bondsWithEvents,
        sanEvents: sanEvents.map((ev) => ({
          id: ev.id,
          delta: ev.delta,
          source: ev.source,
          sessionId: ev.sessionId,
          crossedThresholds: ev.crossedThresholds ?? null,
          appliedAt:
            ev.appliedAt instanceof Date ? ev.appliedAt.toISOString() : String(ev.appliedAt),
        })),
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        incomingEdges: toExportEdges(edgeCtx.incoming),
        entityNameById: edgeCtx.entityNameById,
      })
      files.push({ path: `pc/${slugifyName(pc.name)}.md`, body: md })
    }),
  )

  // ─── NPCs ────────────────────────────────────────────────────────────
  await Promise.all(
    npcs.map(async (npc) => {
      const edgeCtx = await loadEdgeContext('npc', npc.id)
      const extraNames: Record<string, string> = {}
      if (npc.factionId) {
        const [f] = await db
          .select({ id: schema.factions.id, name: schema.factions.name })
          .from(schema.factions)
          .where(eq(schema.factions.id, npc.factionId))
          .limit(1)
        if (f) extraNames[f.id] = f.name
      }
      if (npc.locationId) {
        const [l] = await db
          .select({ id: schema.locations.id, name: schema.locations.name })
          .from(schema.locations)
          .where(eq(schema.locations.id, npc.locationId))
          .limit(1)
        if (l) extraNames[l.id] = l.name
      }
      const md = serializeEntity({
        kind: 'npc',
        npc: {
          id: npc.id,
          name: npc.name,
          description: npc.description,
          factionId: npc.factionId,
          profession: npc.profession,
          str: npc.str,
          con: npc.con,
          dex: npc.dex,
          intelligence: npc.intelligence,
          pow: npc.pow,
          cha: npc.cha,
          hp: npc.hp,
          wp: npc.wp,
          mannerisms: npc.mannerisms,
          voice: npc.voice,
          secrets: npc.secrets,
          status: npc.status as NpcStatus,
          locationId: npc.locationId,
          currentGoal: npc.currentGoal,
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        incomingEdges: toExportEdges(edgeCtx.incoming),
        entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
      })
      files.push({ path: `npc/${slugifyName(npc.name)}.md`, body: md })
    }),
  )

  // ─── Clues ───────────────────────────────────────────────────────────
  await Promise.all(
    clues.map(async (clue) => {
      const edgeCtx = await loadEdgeContext('clue', clue.id)
      const extraNames: Record<string, string> = {}
      if (clue.originScenarioId) {
        const [s] = await db
          .select({ id: schema.scenarios.id, name: schema.scenarios.name })
          .from(schema.scenarios)
          .where(eq(schema.scenarios.id, clue.originScenarioId))
          .limit(1)
        if (s) extraNames[s.id] = s.name
      }
      const md = serializeEntity({
        kind: 'clue',
        clue: {
          id: clue.id,
          name: clue.name,
          description: clue.description,
          originScenarioId: clue.originScenarioId,
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
      })
      files.push({ path: `clue/${slugifyName(clue.name)}.md`, body: md })
    }),
  )

  // ─── Factions ────────────────────────────────────────────────────────
  await Promise.all(
    factions.map(async (faction) => {
      const edgeCtx = await loadEdgeContext('faction', faction.id)
      const md = serializeEntity({
        kind: 'faction',
        faction: {
          id: faction.id,
          name: faction.name,
          description: faction.description,
          agenda: faction.agenda,
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        incomingEdges: toExportEdges(edgeCtx.incoming),
        entityNameById: edgeCtx.entityNameById,
      })
      files.push({ path: `faction/${slugifyName(faction.name)}.md`, body: md })
    }),
  )

  // ─── Locations ───────────────────────────────────────────────────────
  await Promise.all(
    locations.map(async (location) => {
      const edgeCtx = await loadEdgeContext('location', location.id)
      const extraNames: Record<string, string> = {}
      if (location.parentLocationId) {
        const [p] = await db
          .select({ id: schema.locations.id, name: schema.locations.name })
          .from(schema.locations)
          .where(eq(schema.locations.id, location.parentLocationId))
          .limit(1)
        if (p) extraNames[p.id] = p.name
      }
      const md = serializeEntity({
        kind: 'location',
        location: {
          id: location.id,
          parentLocationId: location.parentLocationId,
          name: location.name,
          description: location.description,
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        incomingEdges: toExportEdges(edgeCtx.incoming),
        entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
      })
      files.push({ path: `location/${slugifyName(location.name)}.md`, body: md })
    }),
  )

  // ─── Items ───────────────────────────────────────────────────────────
  await Promise.all(
    items.map(async (item) => {
      const edgeCtx = await loadEdgeContext('item', item.id)
      const extraNames: Record<string, string> = {}
      if (item.ownerNpcId) {
        const [n] = await db
          .select({ id: schema.npcs.id, name: schema.npcs.name })
          .from(schema.npcs)
          .where(eq(schema.npcs.id, item.ownerNpcId))
          .limit(1)
        if (n) extraNames[n.id] = n.name
      }
      if (item.locationId) {
        const [l] = await db
          .select({ id: schema.locations.id, name: schema.locations.name })
          .from(schema.locations)
          .where(eq(schema.locations.id, item.locationId))
          .limit(1)
        if (l) extraNames[l.id] = l.name
      }
      const md = serializeEntity({
        kind: 'item',
        item: {
          id: item.id,
          name: item.name,
          description: item.description,
          history: item.history,
          ownerNpcId: item.ownerNpcId,
          locationId: item.locationId,
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
      })
      files.push({ path: `item/${slugifyName(item.name)}.md`, body: md })
    }),
  )

  // ─── Sessions ────────────────────────────────────────────────────────
  await Promise.all(
    sessions.map(async (session) => {
      const edgeCtx = await loadEdgeContext('session', session.id)
      const md = serializeEntity({
        kind: 'session',
        session: {
          id: session.id,
          name: session.name,
          description: session.description,
          inGameDate: session.inGameDate,
          inGameDateEnd: session.inGameDateEnd,
          realWorldDate:
            session.realWorldDate instanceof Date
              ? session.realWorldDate.toISOString()
              : (session.realWorldDate ?? null),
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        entityNameById: edgeCtx.entityNameById,
      })
      files.push({ path: `session/${slugifyName(session.name)}.md`, body: md })
    }),
  )

  // ─── Scenarios ───────────────────────────────────────────────────────
  await Promise.all(
    scenarios.map(async (scenario) => {
      const edgeCtx = await loadEdgeContext('scenario', scenario.id)
      const md = serializeEntity({
        kind: 'scenario',
        scenario: {
          id: scenario.id,
          name: scenario.name,
          description: scenario.description,
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        entityNameById: edgeCtx.entityNameById,
      })
      files.push({ path: `scenario/${slugifyName(scenario.name)}.md`, body: md })
    }),
  )

  // ─── Scenes ──────────────────────────────────────────────────────────
  await Promise.all(
    scenes.map(async (scene) => {
      const edgeCtx = await loadEdgeContext('scene', scene.id)
      const extraNames: Record<string, string> = {}
      if (scene.scenarioId) {
        const [s] = await db
          .select({ id: schema.scenarios.id, name: schema.scenarios.name })
          .from(schema.scenarios)
          .where(eq(schema.scenarios.id, scene.scenarioId))
          .limit(1)
        if (s) extraNames[s.id] = s.name
      }
      const md = serializeEntity({
        kind: 'scene',
        scene: {
          id: scene.id,
          scenarioId: scene.scenarioId,
          name: scene.name,
          description: scene.description,
          orderIndex: scene.orderIndex,
        },
        outgoingEdges: toExportEdges(edgeCtx.outgoing),
        incomingEdges: toExportEdges(edgeCtx.incoming),
        entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
      })
      files.push({ path: `scene/${slugifyName(scene.name)}.md`, body: md })
    }),
  )

  const counts: Record<string, number> = {
    pc: pcs.length,
    npc: npcs.length,
    clue: clues.length,
    faction: factions.length,
    location: locations.length,
    item: items.length,
    session: sessions.length,
    scenario: scenarios.length,
    scene: scenes.length,
  }
  return { files, counts }
}

class ArchiveTooLarge extends Error {
  constructor(
    public readonly entityType: string,
    public readonly count: number,
  ) {
    super(
      `Archive too large: ${count} ${entityType} rows exceeds the per-type cap of ${MAX_ROWS_PER_TYPE}`,
    )
    this.name = 'ArchiveTooLarge'
  }
}

function buildReadme(campaignName: string, counts: Record<string, number>): string {
  const lines: string[] = []
  lines.push(`# ${campaignName} — Markdown archive`)
  lines.push('')
  lines.push('One Markdown file per entity, organized by entity type.')
  lines.push('')
  lines.push('## Layout')
  lines.push('')
  lines.push('```')
  lines.push('<type>/<slug>.md')
  lines.push('```')
  lines.push('')
  lines.push('Wiki-link references (`[[Name]]`) connect related entities.')
  lines.push('See `docs/md-import-template.md` for the full format reference.')
  lines.push('')
  lines.push('## Counts')
  lines.push('')
  for (const k of Object.keys(counts).sort()) {
    lines.push(`- **${k}**: ${counts[k]}`)
  }
  lines.push('')
  lines.push('## Round-trip')
  lines.push('')
  lines.push(
    'The archive can be re-imported via the Import page (REQ-016). Round-trip is best-effort and lossy on derived/computed fields (event timestamps are preserved; `createdAt` / `updatedAt` are not).',
  )
  lines.push('')
  return lines.join('\n')
}

function buildIndex(files: ArchiveFile[]): string {
  const lines: string[] = []
  lines.push('# Archive index')
  lines.push('')
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))
  for (const f of sorted) {
    lines.push(`- \`${f.path}\``)
  }
  lines.push('')
  return lines.join('\n')
}

/**
 * GET /campaigns/:id/archive — bundles every entity in the campaign as a
 * Markdown ZIP. Pass `id === 'all'` to dump every campaign in the DB.
 */
export async function serveCampaignArchive(_req: VercelRequest, res: VercelResponse, id: string) {
  const campaign = await resolveCampaign(id)
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' })
  }

  let result: { files: ArchiveFile[]; counts: Record<string, number> }
  try {
    result = await buildArchiveFiles(campaign.mode === 'one' ? campaign.id : undefined)
  } catch (err) {
    if (err instanceof ArchiveTooLarge) {
      return res.status(413).json({
        error: 'Archive too large',
        entityType: err.entityType,
        count: err.count,
        cap: MAX_ROWS_PER_TYPE,
        // TODO: implement streaming export for campaigns above this cap.
      })
    }
    throw err
  }

  // Sort files alphabetically by path so the zip is byte-deterministic.
  const sorted = [...result.files].sort((a, b) => a.path.localeCompare(b.path))

  const zip = new JSZip()
  zip.file('README.md', buildReadme(campaign.name, result.counts), { date: EPOCH })
  zip.file('index.md', buildIndex(sorted), { date: EPOCH })
  for (const f of sorted) {
    zip.file(f.path, f.body, { date: EPOCH })
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    // Default deflate is fine; binary deterministic across runs given pinned dates.
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const filename = `${slugifyName(campaign.name)}-archive.zip`
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.status(200).send(buffer)
}
