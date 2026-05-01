// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compareByInGame, compareByRealWorld, sessionInputSchema } from './session'

describe('sessionInputSchema', () => {
  const valid = {
    name: 'Session 1',
    description: null,
    inGameDate: '1928-03-12',
    inGameDateEnd: '1928-03-14',
    realWorldDate: '2026-04-30',
    campaignId: null,
  }

  it('accepts a valid input', () => {
    const result = sessionInputSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.realWorldDate).toBeInstanceOf(Date)
    }
  })

  it('rejects an empty name', () => {
    expect(sessionInputSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('accepts null in-game and real-world dates', () => {
    const r = sessionInputSchema.safeParse({
      ...valid,
      inGameDate: null,
      inGameDateEnd: null,
      realWorldDate: null,
    })
    expect(r.success).toBe(true)
  })
})

describe('compareByInGame', () => {
  it('orders by in-game start date ascending', () => {
    const sessions = [
      { name: 'B', inGameDate: '1928-03-15' },
      { name: 'A', inGameDate: '1928-03-10' },
      { name: 'C', inGameDate: '1928-03-20' },
    ]
    const sorted = [...sessions].sort(compareByInGame)
    expect(sorted.map((s) => s.name)).toEqual(['A', 'B', 'C'])
  })

  it('treats null in-game dates as last', () => {
    const sessions = [
      { name: 'NoDate', inGameDate: null },
      { name: 'A', inGameDate: '1928-03-10' },
    ]
    const sorted = [...sessions].sort(compareByInGame)
    expect(sorted.map((s) => s.name)).toEqual(['A', 'NoDate'])
  })

  it('orders correctly when in-game ranges overlap (compares start dates)', () => {
    // A: 1928-03-10 → 1928-03-15 (range), B: 1928-03-12 (single day) — both
    // overlap on 03-12-15 but A starts earlier so A < B.
    const sessions = [
      { name: 'B', inGameDate: '1928-03-12', inGameDateEnd: null },
      { name: 'A', inGameDate: '1928-03-10', inGameDateEnd: '1928-03-15' },
    ]
    const sorted = [...sessions].sort(compareByInGame)
    expect(sorted.map((s) => s.name)).toEqual(['A', 'B'])
  })
})

describe('compareByRealWorld', () => {
  it('orders by real-world date ascending', () => {
    const sessions = [
      { name: 'B', realWorldDate: new Date('2026-04-15') },
      { name: 'A', realWorldDate: new Date('2026-04-01') },
      { name: 'C', realWorldDate: new Date('2026-05-01') },
    ]
    const sorted = [...sessions].sort(compareByRealWorld)
    expect(sorted.map((s) => s.name)).toEqual(['A', 'B', 'C'])
  })

  it('treats null real-world dates as last', () => {
    const sessions = [
      { name: 'Planned', realWorldDate: null },
      { name: 'Played', realWorldDate: new Date('2026-04-01') },
    ]
    const sorted = [...sessions].sort(compareByRealWorld)
    expect(sorted.map((s) => s.name)).toEqual(['Played', 'Planned'])
  })

  it('accepts ISO date strings as well as Date instances', () => {
    const sessions = [
      { name: 'B', realWorldDate: '2026-04-15' },
      { name: 'A', realWorldDate: '2026-04-01' },
    ]
    const sorted = [...sessions].sort(compareByRealWorld)
    expect(sorted.map((s) => s.name)).toEqual(['A', 'B'])
  })
})

describe('hybrid timeline (REQ-010 acceptance)', () => {
  it('overlapping in-game dates with distinct IRL dates produce different orderings', () => {
    // Two sessions with overlapping in-game ranges but reversed IRL dates.
    // S1 happened earlier in-game but was played later IRL.
    // S2 happened later in-game but was played earlier IRL.
    const s1 = {
      name: 'S1',
      inGameDate: '1928-03-10',
      inGameDateEnd: '1928-03-15',
      realWorldDate: new Date('2026-04-20'),
    }
    const s2 = {
      name: 'S2',
      inGameDate: '1928-03-12',
      inGameDateEnd: '1928-03-18',
      realWorldDate: new Date('2026-04-10'),
    }

    const byInGame = [s1, s2].sort(compareByInGame).map((s) => s.name)
    const byRealWorld = [s1, s2].sort(compareByRealWorld).map((s) => s.name)

    expect(byInGame).toEqual(['S1', 'S2'])
    expect(byRealWorld).toEqual(['S2', 'S1'])
    expect(byInGame).not.toEqual(byRealWorld)
  })
})
