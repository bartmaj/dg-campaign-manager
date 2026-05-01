// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { factionInputSchema } from './faction'

describe('factionInputSchema', () => {
  const valid = {
    name: 'The Cult of the Black Goat',
    description: null,
    agenda: 'recruit acolytes',
    campaignId: null,
  }

  it('accepts a minimal valid input', () => {
    expect(factionInputSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(factionInputSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('accepts null description and agenda', () => {
    expect(
      factionInputSchema.safeParse({ ...valid, description: null, agenda: null }).success,
    ).toBe(true)
  })
})
