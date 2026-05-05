// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compareByOccurredAt, factionStatusEventInputSchema } from './factionStatus.js'

const VALID_FACTION_ID = '00000000-0000-4000-8000-000000000001'
const VALID_SESSION_ID = '00000000-0000-4000-8000-000000000002'

describe('factionStatusEventInputSchema', () => {
  it('accepts a valid input with ISO date and optional sessionId', () => {
    const result = factionStatusEventInputSchema.safeParse({
      factionId: VALID_FACTION_ID,
      note: 'New leadership emerges.',
      occurredAt: '2026-04-30T00:00:00Z',
      sessionId: VALID_SESSION_ID,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.occurredAt).toBeInstanceOf(Date)
      expect(result.data.sessionId).toBe(VALID_SESSION_ID)
    }
  })

  it('rejects an empty note', () => {
    const result = factionStatusEventInputSchema.safeParse({
      factionId: VALID_FACTION_ID,
      note: '',
      occurredAt: '2026-04-30T00:00:00Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('compareByOccurredAt', () => {
  it('orders strictly by occurredAt ascending', () => {
    const rows = [
      { occurredAt: new Date('2026-03-01'), createdAt: new Date('2026-03-01') },
      { occurredAt: new Date('2026-01-01'), createdAt: new Date('2026-03-01') },
      { occurredAt: new Date('2026-02-01'), createdAt: new Date('2026-03-01') },
    ]
    const sorted = [...rows].sort(compareByOccurredAt)
    expect(sorted.map((r) => r.occurredAt.toISOString().slice(0, 10))).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ])
  })

  it('falls back to createdAt when occurredAt is identical', () => {
    const same = new Date('2026-04-30')
    const rows = [
      { occurredAt: same, createdAt: new Date('2026-05-02'), tag: 'late' },
      { occurredAt: same, createdAt: new Date('2026-05-01'), tag: 'early' },
    ]
    const sorted = [...rows].sort(compareByOccurredAt)
    expect(sorted.map((r) => r.tag)).toEqual(['early', 'late'])
  })
})
