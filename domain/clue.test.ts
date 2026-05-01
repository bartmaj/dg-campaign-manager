// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { clueInputSchema } from './clue'

describe('clueInputSchema', () => {
  const valid = {
    name: 'Bloodstained letter',
    description: null,
    originScenarioId: null,
    campaignId: null,
  }

  it('accepts a minimal valid input', () => {
    expect(clueInputSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(clueInputSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('accepts an originScenarioId when provided', () => {
    expect(clueInputSchema.safeParse({ ...valid, originScenarioId: 'scenario-1' }).success).toBe(
      true,
    )
  })

  it('accepts null description and originScenarioId', () => {
    expect(
      clueInputSchema.safeParse({ ...valid, description: null, originScenarioId: null }).success,
    ).toBe(true)
  })
})
