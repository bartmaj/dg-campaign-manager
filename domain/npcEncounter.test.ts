import { describe, expect, it } from 'vitest'
import { npcEncounterInputSchema } from './npcEncounter.js'

const NPC = '11111111-1111-4111-8111-111111111111'
const SESSION = '22222222-2222-4222-8222-222222222222'

describe('npcEncounterInputSchema', () => {
  it('accepts valid input (with optional note)', () => {
    const parsed = npcEncounterInputSchema.parse({
      npcId: NPC,
      sessionId: SESSION,
      note: 'Met at the docks',
    })
    expect(parsed.npcId).toBe(NPC)
    expect(parsed.sessionId).toBe(SESSION)
    expect(parsed.note).toBe('Met at the docks')
  })

  it('rejects when required fields are missing or non-uuid', () => {
    expect(() => npcEncounterInputSchema.parse({ sessionId: SESSION })).toThrow()
    expect(() => npcEncounterInputSchema.parse({ npcId: NPC })).toThrow()
    expect(() =>
      npcEncounterInputSchema.parse({ npcId: 'not-a-uuid', sessionId: SESSION }),
    ).toThrow()
  })
})
