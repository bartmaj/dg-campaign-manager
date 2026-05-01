// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { scenarioInputSchema } from './scenario'

describe('scenarioInputSchema', () => {
  it('accepts a minimal valid input', () => {
    const r = scenarioInputSchema.safeParse({ name: 'X', description: null, campaignId: null })
    expect(r.success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = scenarioInputSchema.safeParse({ name: '', description: null, campaignId: null })
    expect(r.success).toBe(false)
  })

  it('accepts a description and campaignId', () => {
    const r = scenarioInputSchema.safeParse({
      name: 'Op',
      description: 'desc',
      campaignId: 'c1',
    })
    expect(r.success).toBe(true)
  })
})
