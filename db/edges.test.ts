// @vitest-environment node
import { createClient } from '@libsql/client'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { beforeAll, describe, expect, it } from 'vitest'
import * as schema from './schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

let db: DB

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })
})

describe('polymorphic edges (ADR-002 spike)', () => {
  it('links a clue to a scene and supports reverse-ref lookup', async () => {
    const [campaign] = await db
      .insert(schema.campaigns)
      .values({ name: 'Test Campaign' })
      .returning()
    if (!campaign) throw new Error('campaign not inserted')

    const [scenario] = await db
      .insert(schema.scenarios)
      .values({ campaignId: campaign.id, name: 'Scenario 1' })
      .returning()
    if (!scenario) throw new Error('scenario not inserted')

    const [scene] = await db
      .insert(schema.scenes)
      .values({ scenarioId: scenario.id, name: 'Scene X' })
      .returning()
    if (!scene) throw new Error('scene not inserted')

    const [clue] = await db
      .insert(schema.clues)
      .values({ campaignId: campaign.id, name: 'Bloody letter' })
      .returning()
    if (!clue) throw new Error('clue not inserted')

    await db.insert(schema.edges).values({
      sourceType: 'clue',
      sourceId: clue.id,
      targetType: 'scene',
      targetId: scene.id,
      kind: 'mentions',
    })

    const incoming = await db
      .select()
      .from(schema.edges)
      .where(and(eq(schema.edges.targetType, 'scene'), eq(schema.edges.targetId, scene.id)))

    expect(incoming).toHaveLength(1)
    expect(incoming[0]?.sourceType).toBe('clue')
    expect(incoming[0]?.sourceId).toBe(clue.id)
    expect(incoming[0]?.kind).toBe('mentions')
  })

  it('supports many edges per source and queries them by kind', async () => {
    const [campaign] = await db
      .insert(schema.campaigns)
      .values({ name: 'Many-edges Campaign' })
      .returning()
    if (!campaign) throw new Error('campaign not inserted')

    const [npc] = await db
      .insert(schema.npcs)
      .values({ campaignId: campaign.id, name: 'Agent Smith' })
      .returning()
    if (!npc) throw new Error('npc not inserted')

    const [loc1] = await db
      .insert(schema.locations)
      .values({ campaignId: campaign.id, name: 'Safehouse' })
      .returning()
    const [loc2] = await db
      .insert(schema.locations)
      .values({ campaignId: campaign.id, name: 'Field office' })
      .returning()
    if (!loc1 || !loc2) throw new Error('locations not inserted')

    await db.insert(schema.edges).values([
      {
        sourceType: 'npc',
        sourceId: npc.id,
        targetType: 'location',
        targetId: loc1.id,
        kind: 'occupies',
      },
      {
        sourceType: 'npc',
        sourceId: npc.id,
        targetType: 'location',
        targetId: loc2.id,
        kind: 'frequents',
      },
    ])

    const occupies = await db
      .select()
      .from(schema.edges)
      .where(
        and(
          eq(schema.edges.sourceType, 'npc'),
          eq(schema.edges.sourceId, npc.id),
          eq(schema.edges.kind, 'occupies'),
        ),
      )

    expect(occupies).toHaveLength(1)
    expect(occupies[0]?.targetId).toBe(loc1.id)
  })
})
