// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { deriveAttributes, pcInputSchema, pcStatsSchema } from './pc'

describe('deriveAttributes', () => {
  it('computes derived attrs for an average PC (all 10s)', () => {
    expect(
      deriveAttributes({ str: 10, con: 10, dex: 10, intelligence: 10, pow: 10, cha: 10 }),
    ).toEqual({
      hp: 10,
      wp: 10,
      sanMax: 50,
      bp: 40,
    })
  })

  it('computes derived attrs for the floor (all 1s)', () => {
    expect(deriveAttributes({ str: 1, con: 1, dex: 1, intelligence: 1, pow: 1, cha: 1 })).toEqual({
      hp: 1,
      wp: 1,
      sanMax: 5,
      bp: 4,
    })
  })

  it('computes derived attrs for the ceiling (all 18s)', () => {
    expect(
      deriveAttributes({ str: 18, con: 18, dex: 18, intelligence: 18, pow: 18, cha: 18 }),
    ).toEqual({
      hp: 18,
      wp: 18,
      sanMax: 90,
      bp: 72,
    })
  })

  it('rounds half-up for odd sums', () => {
    // STR 11 + CON 12 = 23 → 11.5 → 12; POW 13 + CHA 14 = 27 → 13.5 → 14
    expect(
      deriveAttributes({ str: 11, con: 12, dex: 10, intelligence: 10, pow: 13, cha: 14 }),
    ).toEqual({
      hp: 12,
      wp: 14,
      sanMax: 65,
      bp: 52,
    })
  })

  it('throws RangeError when a stat is below the minimum', () => {
    expect(() =>
      deriveAttributes({ str: 0, con: 10, dex: 10, intelligence: 10, pow: 10, cha: 10 }),
    ).toThrow(RangeError)
  })

  it('throws RangeError when a stat exceeds the maximum', () => {
    expect(() =>
      deriveAttributes({ str: 10, con: 10, dex: 19, intelligence: 10, pow: 10, cha: 10 }),
    ).toThrow(RangeError)
  })
})

describe('pcStatsSchema', () => {
  it('accepts a valid stat block', () => {
    expect(
      pcStatsSchema.safeParse({ str: 12, con: 11, dex: 10, intelligence: 14, pow: 13, cha: 9 })
        .success,
    ).toBe(true)
  })

  it('rejects an out-of-range stat', () => {
    expect(
      pcStatsSchema.safeParse({ str: 25, con: 11, dex: 10, intelligence: 14, pow: 13, cha: 9 })
        .success,
    ).toBe(false)
  })
})

describe('pcInputSchema', () => {
  const validInput = {
    name: 'Agent Carter',
    profession: 'FBI Special Agent',
    campaignId: null,
    stats: { str: 12, con: 12, dex: 13, intelligence: 14, pow: 13, cha: 11 },
    skills: [
      { name: 'Firearms', rating: 50 },
      { name: 'Persuade', rating: 40 },
    ],
    motivations: ['Protect the innocent', 'Uncover the truth'],
    backstoryHooks: 'Lost partner in a botched raid.',
  }

  it('accepts a complete valid input', () => {
    expect(pcInputSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects an input with empty name', () => {
    expect(pcInputSchema.safeParse({ ...validInput, name: '' }).success).toBe(false)
  })

  it('rejects an input with malformed stats', () => {
    expect(
      pcInputSchema.safeParse({
        ...validInput,
        stats: { ...validInput.stats, pow: 0 },
      }).success,
    ).toBe(false)
  })
})
