import { describe, expect, it } from 'vitest'
import {
  clueDeliveryInputSchema,
  computeDeliveryState,
  isClueDeliveredToPc,
  type DeliveryEvent,
} from './clueDelivery.js'

const SESSION_A = '11111111-1111-4111-8111-111111111111'
const SESSION_B = '22222222-2222-4222-8222-222222222222'
const CLUE = '33333333-3333-4333-8333-333333333333'

function ev(overrides: Partial<DeliveryEvent>): DeliveryEvent {
  return {
    sessionId: SESSION_A,
    kind: 'delivered',
    pcIds: ['pc-1'],
    appliedAt: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  }
}

describe('computeDeliveryState', () => {
  it('happy path: a single delivered event marks the clue delivered', () => {
    const state = computeDeliveryState([ev({ pcIds: ['pc-1', 'pc-2'] })])
    expect(state.isDelivered).toBe(true)
    expect(state.delivered.size).toBe(1)
    expect(state.delivered.get(SESSION_A)?.pcIds).toEqual(['pc-1', 'pc-2'])
    expect(state.lastEventAt).toEqual(new Date('2026-01-01T10:00:00Z'))
  })

  it('undelivery removes the entry for that session (history preserved by caller)', () => {
    const state = computeDeliveryState([
      ev({ appliedAt: new Date('2026-01-01T10:00:00Z') }),
      ev({
        kind: 'undelivered',
        pcIds: [],
        appliedAt: new Date('2026-01-01T11:00:00Z'),
      }),
    ])
    expect(state.isDelivered).toBe(false)
    expect(state.delivered.size).toBe(0)
  })

  it('redelivery to the same session updates the recipient pcIds', () => {
    const state = computeDeliveryState([
      ev({ pcIds: ['pc-1'], appliedAt: new Date('2026-01-01T10:00:00Z') }),
      ev({ pcIds: ['pc-1', 'pc-2'], appliedAt: new Date('2026-01-01T11:00:00Z') }),
    ])
    expect(state.delivered.get(SESSION_A)?.pcIds).toEqual(['pc-1', 'pc-2'])
  })

  it('tracks deliveries to different sessions independently', () => {
    const state = computeDeliveryState([
      ev({ sessionId: SESSION_A, pcIds: ['pc-1'] }),
      ev({
        sessionId: SESSION_B,
        pcIds: ['pc-2'],
        appliedAt: new Date('2026-01-01T11:00:00Z'),
      }),
    ])
    expect(state.delivered.size).toBe(2)
    expect(state.delivered.get(SESSION_A)?.pcIds).toEqual(['pc-1'])
    expect(state.delivered.get(SESSION_B)?.pcIds).toEqual(['pc-2'])
  })

  it('isClueDeliveredToPc reflects current state across sessions', () => {
    const events = [
      ev({ sessionId: SESSION_A, pcIds: ['pc-1'] }),
      ev({
        sessionId: SESSION_B,
        pcIds: ['pc-2'],
        appliedAt: new Date('2026-01-01T11:00:00Z'),
      }),
      ev({
        sessionId: SESSION_A,
        kind: 'undelivered',
        pcIds: [],
        appliedAt: new Date('2026-01-01T12:00:00Z'),
      }),
    ]
    expect(isClueDeliveredToPc(events, 'pc-1')).toBe(false)
    expect(isClueDeliveredToPc(events, 'pc-2')).toBe(true)
    expect(isClueDeliveredToPc(events, 'pc-3')).toBe(false)
  })
})

describe('computeDeliveryState date coercion', () => {
  it('handles appliedAt as ISO string and number millis interchangeably', () => {
    const state = computeDeliveryState([
      ev({ pcIds: ['pc-1'], appliedAt: '2026-01-01T10:00:00Z' }),
      ev({ pcIds: ['pc-2'], appliedAt: new Date('2026-01-01T11:00:00Z').getTime() }),
    ])
    expect(state.delivered.get(SESSION_A)?.pcIds).toEqual(['pc-2'])
  })

  it('treats unparseable appliedAt strings as epoch (sortable)', () => {
    const state = computeDeliveryState([ev({ appliedAt: 'not-a-date' })])
    expect(state.lastEventAt?.getTime()).toBe(0)
  })
})

describe('clueDeliveryInputSchema', () => {
  it('rejects delivered with empty pcIds', () => {
    const r = clueDeliveryInputSchema.safeParse({
      clueId: CLUE,
      sessionId: SESSION_A,
      kind: 'delivered',
      pcIds: [],
    })
    expect(r.success).toBe(false)
  })

  it('accepts undelivered with empty pcIds', () => {
    const r = clueDeliveryInputSchema.safeParse({
      clueId: CLUE,
      sessionId: SESSION_A,
      kind: 'undelivered',
      pcIds: [],
    })
    expect(r.success).toBe(true)
  })
})
