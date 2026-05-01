// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { itemInputSchema } from './item'

describe('itemInputSchema', () => {
  const valid = {
    name: 'Tarnished Silver Ring',
    description: 'engraved with unfamiliar glyphs',
    history: null,
    ownerNpcId: null,
    locationId: null,
    campaignId: null,
  }

  it('accepts a minimal valid input', () => {
    expect(itemInputSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(itemInputSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('accepts ownerNpcId and locationId references', () => {
    expect(
      itemInputSchema.safeParse({
        ...valid,
        ownerNpcId: 'npc-1',
        locationId: 'loc-1',
      }).success,
    ).toBe(true)
  })
})
