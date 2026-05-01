// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { sceneInputSchema } from './scene'

describe('sceneInputSchema', () => {
  it('accepts a minimal valid input', () => {
    const r = sceneInputSchema.safeParse({
      scenarioId: 's1',
      name: 'Briefing',
      description: null,
      orderIndex: 0,
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing scenarioId', () => {
    const r = sceneInputSchema.safeParse({
      scenarioId: '',
      name: 'X',
      description: null,
      orderIndex: 0,
    })
    expect(r.success).toBe(false)
  })

  it('defaults orderIndex to 0 when omitted', () => {
    const r = sceneInputSchema.safeParse({
      scenarioId: 's1',
      name: 'X',
      description: null,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.orderIndex).toBe(0)
  })
})
