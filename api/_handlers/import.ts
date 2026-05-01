import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { parseScenarioMarkdown, type ImportedData } from '../../domain/mdImport'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function importScenario(req: VercelRequest, res: VercelResponse) {
  let markdown: string | undefined
  if (req.body && typeof req.body === 'object' && 'markdown' in req.body) {
    const m = (req.body as { markdown?: unknown }).markdown
    if (typeof m === 'string') markdown = m
  } else if (typeof req.body === 'string') {
    markdown = req.body
  }

  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return res.status(400).json({
      errors: [
        {
          line: 0,
          field: 'body',
          message: 'Request body must be `{ markdown: string }` JSON or a raw text body.',
        },
      ],
    })
  }

  const parsed = parseScenarioMarkdown(markdown)
  if (!parsed.ok) {
    return res.status(400).json({ errors: parsed.errors })
  }

  let campaignId: string
  const [existing] = await db
    .select()
    .from(schema.campaigns)
    .orderBy(asc(schema.campaigns.createdAt))
    .limit(1)
  if (existing) {
    campaignId = existing.id
  } else {
    const inserted = await db
      .insert(schema.campaigns)
      .values({ name: 'Default Campaign', description: null })
      .returning()
    const created = inserted[0]
    if (!created) {
      return res.status(500).json({ error: 'Failed to auto-create default campaign' })
    }
    campaignId = created.id
  }

  try {
    const result = await db.transaction(async (tx) => {
      return await ingest(tx, campaignId, parsed.data)
    })
    return res.status(201).json(result)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

async function ingest(tx: Tx, campaignId: string, data: ImportedData) {
  const scenarioId = crypto.randomUUID()
  await tx.insert(schema.scenarios).values({
    id: scenarioId,
    campaignId,
    name: data.scenario.name,
    description: data.scenario.description,
  })

  const locationIdByName = new Map<string, string>()
  for (const l of data.locations) {
    locationIdByName.set(l.name, crypto.randomUUID())
  }
  for (const l of data.locations) {
    const id = locationIdByName.get(l.name)!
    const parentId = l.parentName ? (locationIdByName.get(l.parentName) ?? null) : null
    await tx.insert(schema.locations).values({
      id,
      campaignId,
      name: l.name,
      description: l.description,
      parentLocationId: parentId,
    })
  }

  const factionIdByName = new Map<string, string>()
  for (const f of data.factions) {
    const id = crypto.randomUUID()
    factionIdByName.set(f.name, id)
    await tx.insert(schema.factions).values({
      id,
      campaignId,
      name: f.name,
      description: f.description,
      agenda: f.agenda,
    })
  }

  const npcIdByName = new Map<string, string>()
  for (const n of data.npcs) {
    const id = crypto.randomUUID()
    npcIdByName.set(n.name, id)
    await tx.insert(schema.npcs).values({
      id,
      campaignId,
      name: n.name,
      description: n.description,
      profession: n.profession,
      status: n.status,
      factionId: n.factionName ? (factionIdByName.get(n.factionName) ?? null) : null,
      locationId: n.locationName ? (locationIdByName.get(n.locationName) ?? null) : null,
      mannerisms: n.mannerisms,
      voice: n.voice,
      secrets: n.secrets,
      currentGoal: n.currentGoal,
    })
  }

  const itemIdByName = new Map<string, string>()
  for (const it of data.items) {
    const id = crypto.randomUUID()
    itemIdByName.set(it.name, id)
    await tx.insert(schema.items).values({
      id,
      campaignId,
      name: it.name,
      description: it.description,
      ownerNpcId: it.ownerNpcName ? (npcIdByName.get(it.ownerNpcName) ?? null) : null,
      locationId: it.locationName ? (locationIdByName.get(it.locationName) ?? null) : null,
    })
  }

  const clueIdByName = new Map<string, string>()
  for (const c of data.clues) {
    const id = crypto.randomUUID()
    clueIdByName.set(c.name, id)
    await tx.insert(schema.clues).values({
      id,
      campaignId,
      name: c.name,
      description: c.description,
      originScenarioId: scenarioId,
    })
  }

  const sceneIdByName = new Map<string, string>()
  for (const s of data.scenes) {
    const id = crypto.randomUUID()
    sceneIdByName.set(s.name, id)
    await tx.insert(schema.scenes).values({
      id,
      scenarioId,
      name: s.name,
      description: s.description,
      orderIndex: s.orderIndex,
    })
  }

  const idMaps: Record<string, Map<string, string>> = {
    npc: npcIdByName,
    faction: factionIdByName,
    location: locationIdByName,
    item: itemIdByName,
    clue: clueIdByName,
    scene: sceneIdByName,
  }

  let edgeCount = 0
  for (const e of data.edges) {
    const sourceId = idMaps[e.sourceType]?.get(e.sourceName)
    const targetId = idMaps[e.targetType]?.get(e.targetName)
    if (!sourceId || !targetId) {
      throw new Error(
        `Internal: failed to resolve edge ${e.sourceType}/${e.sourceName} → ${e.targetType}/${e.targetName}`,
      )
    }
    await tx.insert(schema.edges).values({
      sourceType: e.sourceType,
      sourceId,
      targetType: e.targetType,
      targetId,
      kind: e.kind,
      notes: null,
    })
    edgeCount++
  }

  return {
    scenarioId,
    counts: {
      locations: data.locations.length,
      factions: data.factions.length,
      npcs: data.npcs.length,
      items: data.items.length,
      clues: data.clues.length,
      scenes: data.scenes.length,
      edges: edgeCount,
    },
  }
}
