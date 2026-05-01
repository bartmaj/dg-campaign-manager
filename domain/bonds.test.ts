// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { applyDamage, bondDamageInputSchema, bondInputSchema, summarizeHistory } from './bonds'

describe('applyDamage', () => {
  it('decreases current score on negative delta', () => {
    expect(applyDamage(12, -3)).toBe(9)
  })

  it('increases current score on positive delta (repair)', () => {
    expect(applyDamage(8, 2)).toBe(10)
  })

  it('clamps to 0 by default', () => {
    expect(applyDamage(2, -5)).toBe(0)
  })

  it('honors a custom floor', () => {
    expect(applyDamage(5, -10, { floor: 1 })).toBe(1)
  })

  it('honors a custom ceiling', () => {
    expect(applyDamage(10, 5, { ceiling: 12 })).toBe(12)
  })

  it('allows repair past original max if no ceiling supplied', () => {
    expect(applyDamage(10, 50)).toBe(60)
  })
})

describe('summarizeHistory', () => {
  const t1 = new Date('2026-01-01T00:00:00Z')
  const t2 = new Date('2026-02-01T00:00:00Z')
  const t3 = new Date('2026-03-01T00:00:00Z')

  it('separates damage from repair and picks the latest timestamp', () => {
    const summary = summarizeHistory([
      { delta: -3, appliedAt: t1 },
      { delta: -2, appliedAt: t2 },
      { delta: 1, appliedAt: t3 },
    ])
    expect(summary.totalDamage).toBe(5)
    expect(summary.totalRepair).toBe(1)
    expect(summary.lastChangeAt).toEqual(t3)
  })

  it('returns zeros and null on empty input', () => {
    expect(summarizeHistory([])).toEqual({
      totalDamage: 0,
      totalRepair: 0,
      lastChangeAt: null,
    })
  })
})

describe('bondInputSchema', () => {
  const valid = {
    pcId: 'pc-1',
    name: 'Sister Mary',
    targetType: 'npc' as const,
    targetId: 'npc-1',
    maxScore: 12,
  }

  it('accepts a minimal valid input', () => {
    expect(bondInputSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(bondInputSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects an unknown targetType', () => {
    expect(bondInputSchema.safeParse({ ...valid, targetType: 'faction' }).success).toBe(false)
  })

  it('accepts an explicit currentScore', () => {
    expect(bondInputSchema.safeParse({ ...valid, currentScore: 7 }).success).toBe(true)
  })
})

describe('bondDamageInputSchema', () => {
  it('accepts a negative delta with reason and session', () => {
    expect(
      bondDamageInputSchema.safeParse({
        delta: -3,
        reason: 'Witnessed her death',
        sessionId: 'sess-1',
      }).success,
    ).toBe(true)
  })

  it('accepts a bare delta', () => {
    expect(bondDamageInputSchema.safeParse({ delta: 1 }).success).toBe(true)
  })

  it('rejects a non-integer delta', () => {
    expect(bondDamageInputSchema.safeParse({ delta: 1.5 }).success).toBe(false)
  })
})
