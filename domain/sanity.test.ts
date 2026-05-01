// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  applySanityChange,
  detectCrossedThresholds,
  sanChangeInputSchema,
  summarizeSanHistory,
} from './sanity'

describe('applySanityChange', () => {
  it('decreases current SAN on negative delta', () => {
    expect(applySanityChange(50, -5)).toBe(45)
  })

  it('increases current SAN on positive delta (gain)', () => {
    expect(applySanityChange(40, 3)).toBe(43)
  })

  it('clamps to 0 by default', () => {
    expect(applySanityChange(2, -10)).toBe(0)
  })

  it('honors a custom floor', () => {
    expect(applySanityChange(5, -10, { floor: 1 })).toBe(1)
  })

  it('honors a custom ceiling (e.g. SAN max)', () => {
    expect(applySanityChange(60, 10, { ceiling: 65 })).toBe(65)
  })
})

describe('detectCrossedThresholds', () => {
  // Typical DG breaking points for POW 13: 52, 39, 26, 13.
  const thresholds = [52, 39, 26, 13]

  it('flags one crossing on a downward change through a single threshold', () => {
    // 50 → 38 crosses 39.
    expect(detectCrossedThresholds(50, 38, thresholds)).toEqual([39])
  })

  it('flags multiple crossings on a single downward drop', () => {
    // 50 → 12 crosses 39, 26, 13 (in descent order).
    expect(detectCrossedThresholds(50, 12, thresholds)).toEqual([39, 26, 13])
  })

  it('returns empty on a no-op (delta = 0)', () => {
    expect(detectCrossedThresholds(40, 40, thresholds)).toEqual([])
  })

  it('returns empty when staying within a band', () => {
    // 38 → 30 stays in (26, 39) band.
    expect(detectCrossedThresholds(38, 30, thresholds)).toEqual([])
  })

  it('flags upward crossings back through a threshold', () => {
    // 30 → 45 ascends through 39 (gaining SAN).
    expect(detectCrossedThresholds(30, 45, thresholds)).toEqual([39])
  })

  it('treats sitting AT a threshold and dropping below as a crossing', () => {
    // 39 → 35 crosses 39 (we leave it).
    expect(detectCrossedThresholds(39, 35, thresholds)).toEqual([39])
  })

  it('does NOT flag landing exactly on a threshold from above', () => {
    // 50 → 39: still at 39, has not descended through it.
    expect(detectCrossedThresholds(50, 39, thresholds)).toEqual([])
  })

  it('flags upward crossing when landing exactly on threshold from below', () => {
    // 30 → 39: ascends to and onto 39 — counted as a crossing.
    expect(detectCrossedThresholds(30, 39, thresholds)).toEqual([39])
  })

  it('returns empty when the thresholds list is empty', () => {
    expect(detectCrossedThresholds(50, 10, [])).toEqual([])
  })
})

describe('summarizeSanHistory', () => {
  const t1 = new Date('2026-01-01T00:00:00Z')
  const t2 = new Date('2026-02-01T00:00:00Z')
  const t3 = new Date('2026-03-01T00:00:00Z')

  it('separates loss from gain, totals crossings, picks the latest timestamp', () => {
    const summary = summarizeSanHistory([
      { delta: -5, appliedAt: t1, crossedThresholds: [39] },
      { delta: -8, appliedAt: t2, crossedThresholds: [26, 13] },
      { delta: 2, appliedAt: t3, crossedThresholds: [] },
    ])
    expect(summary.totalLoss).toBe(13)
    expect(summary.totalGain).toBe(2)
    expect(summary.totalCrossings).toBe(3)
    expect(summary.lastChangeAt).toEqual(t3)
  })

  it('returns zeros and null on empty input', () => {
    expect(summarizeSanHistory([])).toEqual({
      totalLoss: 0,
      totalGain: 0,
      totalCrossings: 0,
      lastChangeAt: null,
    })
  })
})

describe('sanChangeInputSchema', () => {
  it('accepts a valid loss with source', () => {
    expect(
      sanChangeInputSchema.safeParse({
        delta: -5,
        source: 'saw the deep one',
      }).success,
    ).toBe(true)
  })

  it('accepts a valid gain with sessionId', () => {
    expect(
      sanChangeInputSchema.safeParse({
        delta: 3,
        source: 'therapy session',
        sessionId: 'sess-7',
      }).success,
    ).toBe(true)
  })

  it('rejects an empty source', () => {
    expect(sanChangeInputSchema.safeParse({ delta: -1, source: '' }).success).toBe(false)
  })

  it('rejects a missing source', () => {
    expect(sanChangeInputSchema.safeParse({ delta: -1 }).success).toBe(false)
  })

  it('rejects a non-integer delta', () => {
    expect(sanChangeInputSchema.safeParse({ delta: -1.5, source: 'x' }).success).toBe(false)
  })
})
