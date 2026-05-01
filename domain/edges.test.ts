// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EDGE_RULES, edgeInputSchema, getEdgeRule, isValidEdge, kindsForSource } from './edges'

describe('EDGE_RULES allowlist', () => {
  it('contains the canonical clue→faction implicates rule', () => {
    expect(getEdgeRule('clue', 'implicates', 'faction')).toBeDefined()
  })

  it('contains the canonical npc→location occupies rule', () => {
    expect(getEdgeRule('npc', 'occupies', 'location')).toBeDefined()
  })

  it('has unique (source, kind, target) triples', () => {
    const seen = new Set<string>()
    for (const r of EDGE_RULES) {
      const key = `${r.source}|${r.kind}|${r.target}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })
})

describe('isValidEdge', () => {
  it('accepts canonical triples', () => {
    expect(isValidEdge('clue', 'implicates', 'faction')).toBe(true)
    expect(isValidEdge('npc', 'occupies', 'location')).toBe(true)
    expect(isValidEdge('pc', 'bond_with', 'npc')).toBe(true)
    expect(isValidEdge('item', 'owned_by', 'npc')).toBe(true)
    expect(isValidEdge('session', 'runs_through', 'scenario')).toBe(true)
  })

  it('rejects unknown kinds', () => {
    expect(isValidEdge('clue', 'loves', 'faction')).toBe(false)
    expect(isValidEdge('npc', 'haunts', 'location')).toBe(false)
  })

  it('rejects valid kind with wrong types', () => {
    // 'implicates' is only valid for clue → faction
    expect(isValidEdge('npc', 'implicates', 'npc')).toBe(false)
    expect(isValidEdge('clue', 'implicates', 'npc')).toBe(false)
    // 'occupies' is only valid for npc → location
    expect(isValidEdge('pc', 'occupies', 'location')).toBe(false)
  })
})

describe('kindsForSource', () => {
  it('returns all kinds for a (source, target) pair', () => {
    const npcLocation = kindsForSource('npc', 'location')
    expect(new Set(npcLocation)).toEqual(new Set(['occupies', 'frequents']))
  })

  it('returns the single kind when only one is defined', () => {
    expect(kindsForSource('clue', 'faction')).toEqual(['implicates'])
  })

  it('returns an empty list for an unsupported pair', () => {
    expect(kindsForSource('bond', 'campaign')).toEqual([])
  })
})

describe('edgeInputSchema', () => {
  const valid = {
    sourceType: 'clue' as const,
    sourceId: 'clue-1',
    targetType: 'faction' as const,
    targetId: 'faction-1',
    kind: 'implicates',
    notes: null,
  }

  it('accepts a valid triple', () => {
    expect(edgeInputSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts an omitted notes field', () => {
    const rest = { ...valid }
    delete (rest as { notes?: unknown }).notes
    expect(edgeInputSchema.safeParse(rest).success).toBe(true)
  })

  it('rejects an unknown kind', () => {
    expect(edgeInputSchema.safeParse({ ...valid, kind: 'loves' }).success).toBe(false)
  })

  it('rejects valid-kind-but-wrong-types', () => {
    const result = edgeInputSchema.safeParse({
      ...valid,
      sourceType: 'npc' as const,
      targetType: 'npc' as const,
      kind: 'implicates',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty sourceId', () => {
    expect(edgeInputSchema.safeParse({ ...valid, sourceId: '' }).success).toBe(false)
  })

  it('rejects an unknown entity type', () => {
    expect(
      edgeInputSchema.safeParse({ ...valid, sourceType: 'monster' as unknown as 'clue' }).success,
    ).toBe(false)
  })
})
