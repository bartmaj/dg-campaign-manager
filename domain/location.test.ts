// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { locationInputSchema } from './location'

describe('locationInputSchema', () => {
  const valid = {
    name: 'Abandoned Lighthouse',
    description: 'a crumbling tower on the cape',
    parentLocationId: null,
    campaignId: null,
  }

  it('accepts a minimal valid input', () => {
    expect(locationInputSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(locationInputSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('accepts a parentLocationId reference', () => {
    expect(locationInputSchema.safeParse({ ...valid, parentLocationId: 'loc-1' }).success).toBe(
      true,
    )
  })
})
