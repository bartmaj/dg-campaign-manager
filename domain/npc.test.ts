// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { NPC_STATUSES, npcInputSchema, npcStatBlockSchema } from './npc'

describe('npcStatBlockSchema', () => {
  it('accepts a simplified stat block', () => {
    expect(npcStatBlockSchema.safeParse({ kind: 'simplified', hp: 8, wp: 6 }).success).toBe(true)
  })

  it('accepts a full stat block', () => {
    expect(
      npcStatBlockSchema.safeParse({
        kind: 'full',
        stats: { str: 11, con: 12, dex: 10, intelligence: 13, pow: 12, cha: 10 },
      }).success,
    ).toBe(true)
  })

  it('rejects a full stat block with an out-of-range stat (range rules from pc.ts)', () => {
    expect(
      npcStatBlockSchema.safeParse({
        kind: 'full',
        stats: { str: 99, con: 12, dex: 10, intelligence: 13, pow: 12, cha: 10 },
      }).success,
    ).toBe(false)
  })

  it('rejects a stat block with no kind discriminator', () => {
    expect(npcStatBlockSchema.safeParse({ hp: 8, wp: 6 }).success).toBe(false)
  })
})

describe('NPC_STATUSES', () => {
  it('contains exactly the four canonical values', () => {
    expect([...NPC_STATUSES].sort()).toEqual(['alive', 'dead', 'missing', 'turned'])
  })
})

describe('npcInputSchema', () => {
  const validSimplified = {
    name: 'Cultist Goon',
    profession: 'Cultist',
    campaignId: null,
    factionId: null,
    locationId: null,
    status: 'alive' as const,
    statBlock: { kind: 'simplified' as const, hp: 8, wp: 6 },
    mannerisms: 'twitches when nervous',
    voice: 'reedy',
    secrets: 'knows where the cell meets',
    currentGoal: 'recruit more members',
    description: null,
  }

  const validFull = {
    ...validSimplified,
    name: 'Major Antagonist',
    statBlock: {
      kind: 'full' as const,
      stats: { str: 13, con: 12, dex: 11, intelligence: 14, pow: 14, cha: 13 },
    },
  }

  it('accepts a simplified NPC', () => {
    expect(npcInputSchema.safeParse(validSimplified).success).toBe(true)
  })

  it('accepts a full-stat NPC', () => {
    expect(npcInputSchema.safeParse(validFull).success).toBe(true)
  })

  it('rejects an NPC missing a status', () => {
    const withoutStatus: Record<string, unknown> = { ...validSimplified }
    delete withoutStatus.status
    expect(npcInputSchema.safeParse(withoutStatus).success).toBe(false)
  })

  it('accepts every member of the status enum', () => {
    for (const s of NPC_STATUSES) {
      expect(npcInputSchema.safeParse({ ...validSimplified, status: s }).success).toBe(true)
    }
  })

  it('rejects a status outside the enum', () => {
    expect(npcInputSchema.safeParse({ ...validSimplified, status: 'undead' }).success).toBe(false)
  })

  it('rejects an empty name', () => {
    expect(npcInputSchema.safeParse({ ...validSimplified, name: '' }).success).toBe(false)
  })
})
