// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { serializeEntity, slugifyName, type ExportInput } from './mdExport'
import { parseScenarioMarkdown } from './mdImport'
import type { EdgeRow } from '../src/api/edges'
import type { PcRow } from '../src/api/pcs'
import type { NpcRow } from '../src/api/npcs'
import type { ClueRow } from '../src/api/clues'
import type { FactionRow } from '../src/api/factions'
import type { LocationRow } from '../src/api/locations'
import type { ItemRow } from '../src/api/items'
import type { SessionRow } from '../src/api/sessions'
import type { ScenarioRow } from '../src/api/scenarios'
import type { SceneRow } from '../src/api/scenes'
import type { BondRow } from '../src/api/bonds'
import type { SanChangeEvent } from '../src/api/sanity'

const NAMES = {
  'npc-marlow': 'Agent Marlow',
  'fac-blue': 'Cell Blue',
  'loc-bravo': 'Site Bravo',
  'loc-newark': 'Newark',
  'clue-letter': 'Bloody letter',
  'scene-briefing': 'Briefing',
  'sce-id': 'Operation Reverberate',
  'item-case': 'Forensic Briefcase',
  'pc-1': 'PC One',
}

function edge(
  partial: Partial<EdgeRow> &
    Pick<EdgeRow, 'sourceType' | 'sourceId' | 'targetType' | 'targetId' | 'kind'>,
): EdgeRow {
  return {
    id: partial.id ?? `e-${partial.kind}-${partial.sourceId}-${partial.targetId}`,
    notes: partial.notes ?? null,
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00Z',
    ...partial,
  } as EdgeRow
}

function makePc(overrides: Partial<PcRow> = {}): PcRow {
  return {
    id: 'pc-1',
    campaignId: null,
    name: 'PC One',
    description: 'A field agent.',
    profession: 'Federal Agent',
    str: 12,
    con: 11,
    dex: 13,
    intelligence: 14,
    pow: 12,
    cha: 10,
    hp: 12,
    wp: 12,
    bp: 6,
    sanMax: 60,
    skills: [
      { name: 'Firearms', rating: 50 },
      { name: 'Alertness', rating: 40 },
    ],
    motivations: ['Z protect partner', 'A find the truth'],
    backstoryHooks: 'Lost a partner in Newark.',
    sanityCurrent: 55,
    sanityDisorders: ['Mild paranoia', 'Insomnia'],
    breakingPoints: [48, 36, 24, 12],
    adaptedTo: ['violence'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeNpc(overrides: Partial<NpcRow> = {}): NpcRow {
  return {
    id: 'npc-marlow',
    campaignId: null,
    name: 'Agent Marlow',
    description: 'A burned-out senior agent.',
    factionId: 'fac-blue',
    profession: 'Federal Agent',
    str: 12,
    con: 11,
    dex: 10,
    intelligence: 13,
    pow: 11,
    cha: 12,
    hp: 12,
    wp: 11,
    mannerisms: 'Always smoking.',
    voice: 'Gravelly.',
    secrets: 'Knows where the bodies are buried.',
    status: 'alive',
    locationId: 'loc-bravo',
    currentGoal: 'Find the briefcase.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeClue(overrides: Partial<ClueRow> = {}): ClueRow {
  return {
    id: 'clue-letter',
    campaignId: null,
    name: 'Bloody letter',
    description: 'Half-burned letter pinned to a corkboard.',
    originScenarioId: 'sce-id',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeFaction(overrides: Partial<FactionRow> = {}): FactionRow {
  return {
    id: 'fac-blue',
    campaignId: null,
    name: 'Cell Blue',
    description: 'A rogue DG cell.',
    agenda: 'Recover the Briefcase before the Program does.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeLocation(overrides: Partial<LocationRow> = {}): LocationRow {
  return {
    id: 'loc-bravo',
    campaignId: null,
    parentLocationId: 'loc-newark',
    name: 'Site Bravo',
    description: 'Abandoned warehouse on the edge of Newark.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeItem(overrides: Partial<ItemRow> = {}): ItemRow {
  return {
    id: 'item-case',
    campaignId: null,
    name: 'Forensic Briefcase',
    description: 'Locked aluminium case, FBI seal.',
    history: 'Last seen at Site Bravo.',
    ownerNpcId: 'npc-marlow',
    locationId: 'loc-bravo',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 'sess-1',
    campaignId: 'camp-1',
    name: 'Session 1',
    description: 'First contact.',
    inGameDate: '1995-03-12',
    inGameDateEnd: null,
    realWorldDate: '2026-04-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeScenario(overrides: Partial<ScenarioRow> = {}): ScenarioRow {
  return {
    id: 'sce-id',
    campaignId: null,
    name: 'Operation Reverberate',
    description: 'A pre-dawn raid goes sideways.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeScene(overrides: Partial<SceneRow> = {}): SceneRow {
  return {
    id: 'scene-briefing',
    scenarioId: 'sce-id',
    name: 'Briefing',
    description: 'Players meet their handler.',
    orderIndex: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('serializeEntity — per-type smoke', () => {
  it('serializes a PC with full data', () => {
    const bond: BondRow = {
      id: 'bond-1',
      pcId: 'pc-1',
      name: 'Sister Mary',
      currentScore: 9,
      maxScore: 12,
      targetType: 'npc',
      targetId: 'npc-marlow',
      description: 'Old contact',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    const events = [
      {
        id: 'bde-1',
        bondId: 'bond-1',
        delta: -3,
        reason: 'Lied to her',
        sessionId: null,
        appliedAt: '2026-02-01T00:00:00Z',
      },
    ]
    const sanEvents: SanChangeEvent[] = [
      {
        id: 'sce-1',
        pcId: 'pc-1',
        delta: -5,
        source: 'saw the deep one',
        sessionId: null,
        crossedThresholds: [48],
        appliedAt: '2026-02-01T00:00:00Z',
      },
    ]
    const md = serializeEntity({
      kind: 'pc',
      pc: makePc(),
      bonds: [{ bond, events }],
      sanEvents,
      outgoingEdges: [
        edge({
          sourceType: 'pc',
          sourceId: 'pc-1',
          targetType: 'npc',
          targetId: 'npc-marlow',
          kind: 'bond_with',
        }),
      ],
      entityNameById: NAMES,
    })
    expect(md).toContain('# PC: PC One')
    expect(md).toContain('## Stats')
    expect(md).toContain('- **STR**: 12')
    expect(md).toContain('## Skills')
    // Skills sorted alphabetically — Alertness before Firearms.
    const aIdx = md.indexOf('Alertness')
    const fIdx = md.indexOf('Firearms')
    expect(aIdx).toBeGreaterThan(0)
    expect(aIdx).toBeLessThan(fIdx)
    expect(md).toContain('## Sanity')
    expect(md).toContain('- **Breaking points**: 48, 36, 24, 12')
    expect(md).toContain('## Bonds')
    expect(md).toContain('### Sister Mary')
    expect(md).toContain('- **Score**: 9 / 12')
    expect(md).toContain('[[Agent Marlow]]')
    expect(md).toContain('## SAN history')
    expect(md).toContain('crossed 48')
    expect(md).toContain('## Outgoing relationships')
    expect(md).toContain('- **bond_with** → (npc) [[Agent Marlow]]')
    expect(md.endsWith('\n')).toBe(true)
    expect(md.includes('\r')).toBe(false)
  })

  it('serializes an NPC with full stats and edges', () => {
    const md = serializeEntity({
      kind: 'npc',
      npc: makeNpc(),
      outgoingEdges: [
        edge({
          sourceType: 'npc',
          sourceId: 'npc-marlow',
          targetType: 'faction',
          targetId: 'fac-blue',
          kind: 'member_of',
        }),
        edge({
          sourceType: 'npc',
          sourceId: 'npc-marlow',
          targetType: 'location',
          targetId: 'loc-bravo',
          kind: 'occupies',
        }),
      ],
      entityNameById: NAMES,
    })
    expect(md).toContain('# NPC: Agent Marlow')
    expect(md).toContain('- **Status**: alive')
    expect(md).toContain('- **Faction**: [[Cell Blue]]')
    expect(md).toContain('- **Location**: [[Site Bravo]]')
    expect(md).toContain('## RP hooks')
    expect(md).toContain('- **Mannerisms**: Always smoking.')
    expect(md).toContain('## Outgoing relationships')
    // Sorted by kind: member_of < occupies
    const m = md.indexOf('member_of')
    const o = md.indexOf('occupies')
    expect(m).toBeGreaterThan(0)
    expect(m).toBeLessThan(o)
  })

  it('serializes a simplified NPC (no full stat block)', () => {
    const md = serializeEntity({
      kind: 'npc',
      npc: makeNpc({ str: null, con: null, dex: null, intelligence: null, pow: null, cha: null }),
      entityNameById: NAMES,
    })
    expect(md).toContain('## Stat block')
    expect(md).toContain('Simplified.')
    expect(md).not.toContain('- **STR**')
  })

  it('serializes a Clue', () => {
    const md = serializeEntity({
      kind: 'clue',
      clue: makeClue(),
      outgoingEdges: [
        edge({
          sourceType: 'clue',
          sourceId: 'clue-letter',
          targetType: 'npc',
          targetId: 'npc-marlow',
          kind: 'mentions',
        }),
      ],
      entityNameById: NAMES,
    })
    expect(md).toContain('# Clue: Bloody letter')
    expect(md).toContain('- **Origin scenario**: [[Operation Reverberate]]')
    expect(md).toContain('- **mentions** → (npc) [[Agent Marlow]]')
  })

  it('serializes a Faction', () => {
    const md = serializeEntity({
      kind: 'faction',
      faction: makeFaction(),
      incomingEdges: [
        edge({
          sourceType: 'clue',
          sourceId: 'clue-letter',
          targetType: 'faction',
          targetId: 'fac-blue',
          kind: 'implicates',
        }),
      ],
      entityNameById: NAMES,
    })
    expect(md).toContain('# Faction: Cell Blue')
    expect(md).toContain('- **Agenda**: Recover the Briefcase before the Program does.')
    expect(md).toContain('## Incoming relationships')
    expect(md).toContain('- **implicates** ← (clue) [[Bloody letter]]')
  })

  it('serializes a Location with parent reference', () => {
    const md = serializeEntity({
      kind: 'location',
      location: makeLocation(),
      entityNameById: NAMES,
    })
    expect(md).toContain('# Location: Site Bravo')
    expect(md).toContain('- **Parent**: [[Newark]]')
  })

  it('serializes an Item with owner and history', () => {
    const md = serializeEntity({
      kind: 'item',
      item: makeItem(),
      entityNameById: NAMES,
    })
    expect(md).toContain('# Item: Forensic Briefcase')
    expect(md).toContain('- **Owner**: [[Agent Marlow]]')
    expect(md).toContain('- **Location**: [[Site Bravo]]')
    expect(md).toContain('## History')
    expect(md).toContain('Last seen at Site Bravo.')
  })

  it('serializes a Session', () => {
    const md = serializeEntity({ kind: 'session', session: makeSession() })
    expect(md).toContain('# Session: Session 1')
    expect(md).toContain('- **In-game date**: 1995-03-12')
    expect(md).toContain('- **Real-world date**: 2026-04-01T00:00:00Z')
  })

  it('serializes a Scenario', () => {
    const md = serializeEntity({ kind: 'scenario', scenario: makeScenario() })
    expect(md).toContain('# Scenario: Operation Reverberate')
    expect(md).toContain('- **Description**: A pre-dawn raid goes sideways.')
  })

  it('serializes a Scene', () => {
    const md = serializeEntity({
      kind: 'scene',
      scene: makeScene(),
      incomingEdges: [
        edge({
          sourceType: 'clue',
          sourceId: 'clue-letter',
          targetType: 'scene',
          targetId: 'scene-briefing',
          kind: 'delivered_in',
        }),
      ],
      entityNameById: NAMES,
    })
    expect(md).toContain('# Scene: Briefing')
    expect(md).toContain('- **Order**: 0')
    expect(md).toContain('- **Scenario**: [[Operation Reverberate]]')
    expect(md).toContain('- **delivered_in** ← (clue) [[Bloody letter]]')
  })
})

describe('serializeEntity — determinism (REQ-N04)', () => {
  it('produces identical output across repeated calls', () => {
    const input: ExportInput = {
      kind: 'npc',
      npc: makeNpc(),
      outgoingEdges: [
        edge({
          sourceType: 'npc',
          sourceId: 'npc-marlow',
          targetType: 'faction',
          targetId: 'fac-blue',
          kind: 'member_of',
        }),
      ],
      entityNameById: NAMES,
    }
    const a = serializeEntity(input)
    const b = serializeEntity(input)
    expect(a).toBe(b)
  })

  it('is invariant to edge input order', () => {
    const e1 = edge({
      sourceType: 'npc',
      sourceId: 'npc-marlow',
      targetType: 'faction',
      targetId: 'fac-blue',
      kind: 'member_of',
    })
    const e2 = edge({
      sourceType: 'npc',
      sourceId: 'npc-marlow',
      targetType: 'location',
      targetId: 'loc-bravo',
      kind: 'occupies',
    })
    const e3 = edge({
      sourceType: 'npc',
      sourceId: 'npc-marlow',
      targetType: 'location',
      targetId: 'loc-newark',
      kind: 'frequents',
    })
    const a = serializeEntity({
      kind: 'npc',
      npc: makeNpc(),
      outgoingEdges: [e1, e2, e3],
      entityNameById: NAMES,
    })
    const b = serializeEntity({
      kind: 'npc',
      npc: makeNpc(),
      outgoingEdges: [e3, e1, e2],
      entityNameById: NAMES,
    })
    const c = serializeEntity({
      kind: 'npc',
      npc: makeNpc(),
      outgoingEdges: [e2, e3, e1],
      entityNameById: NAMES,
    })
    expect(a).toBe(b)
    expect(a).toBe(c)
  })

  it('is invariant to skill / motivation / disorder ordering on a PC', () => {
    const a = serializeEntity({
      kind: 'pc',
      pc: makePc({
        skills: [
          { name: 'Alertness', rating: 40 },
          { name: 'Firearms', rating: 50 },
        ],
        motivations: ['A find the truth', 'Z protect partner'],
        sanityDisorders: ['Insomnia', 'Mild paranoia'],
      }),
    })
    const b = serializeEntity({
      kind: 'pc',
      pc: makePc({
        skills: [
          { name: 'Firearms', rating: 50 },
          { name: 'Alertness', rating: 40 },
        ],
        motivations: ['Z protect partner', 'A find the truth'],
        sanityDisorders: ['Mild paranoia', 'Insomnia'],
      }),
    })
    expect(a).toBe(b)
  })

  it('is invariant to bond / SAN event ordering', () => {
    const sanEvents: SanChangeEvent[] = [
      {
        id: 'sce-1',
        pcId: 'pc-1',
        delta: -5,
        source: 'A',
        sessionId: null,
        crossedThresholds: null,
        appliedAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'sce-2',
        pcId: 'pc-1',
        delta: -2,
        source: 'B',
        sessionId: null,
        crossedThresholds: null,
        appliedAt: '2026-02-02T00:00:00Z',
      },
    ]
    const a = serializeEntity({
      kind: 'pc',
      pc: makePc(),
      sanEvents: [...sanEvents],
    })
    const b = serializeEntity({
      kind: 'pc',
      pc: makePc(),
      sanEvents: [...sanEvents].reverse(),
    })
    expect(a).toBe(b)
  })

  it('does not include createdAt/updatedAt on entity rows', () => {
    const md = serializeEntity({ kind: 'pc', pc: makePc() })
    // The fixture uses 2026-01-01 for createdAt/updatedAt — make sure
    // that timestamp isn't leaked. (Event timestamps are 2026-02-…)
    expect(md).not.toContain('2026-01-01T00:00:00Z')
  })
})

describe('serializeEntity — wiki-link fallback when name is unknown', () => {
  it('falls back to id + html comment when entityNameById is not provided', () => {
    const md = serializeEntity({
      kind: 'npc',
      npc: makeNpc(),
    })
    expect(md).toContain('- **Faction**: fac-blue <!-- id: fac-blue -->')
    expect(md).toContain('- **Location**: loc-bravo <!-- id: loc-bravo -->')
  })

  it('uses [[Name]] when the target id is in entityNameById', () => {
    const md = serializeEntity({
      kind: 'npc',
      npc: makeNpc(),
      entityNameById: { 'fac-blue': 'Cell Blue' },
    })
    expect(md).toContain('- **Faction**: [[Cell Blue]]')
    // Location not in name map → falls back.
    expect(md).toContain('- **Location**: loc-bravo <!-- id: loc-bravo -->')
  })
})

describe('slugifyName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyName('Agent Marlow')).toBe('agent-marlow')
  })
  it('strips punctuation', () => {
    expect(slugifyName('Site #B/Ravo!')).toBe('site-b-ravo')
  })
  it('falls back to "untitled" when input has no usable chars', () => {
    expect(slugifyName('!!!')).toBe('untitled')
  })
})

// ─── Round-trip smoke ───────────────────────────────────────────────────────
//
// Goal: assert that the wiki-link references emitted by per-entity export
// re-parse cleanly when stitched back into a scenario doc. We don't try
// to round-trip a whole scenario through per-entity export (the shapes
// differ); instead we cherry-pick an NPC, a Clue, and a Scene from the
// import-template sample and rebuild a minimal scenario from their
// emitted snippets.

describe('serializeEntity — round-trip with mdImport', () => {
  it('per-entity wiki-links survive a re-import as a scenario doc', () => {
    const factionMd = serializeEntity({
      kind: 'faction',
      faction: makeFaction(),
      entityNameById: NAMES,
    })
    const locationMd = serializeEntity({
      kind: 'location',
      location: makeLocation(),
      entityNameById: NAMES,
    })
    const npcMd = serializeEntity({
      kind: 'npc',
      npc: makeNpc(),
      entityNameById: NAMES,
    })
    const clueMd = serializeEntity({
      kind: 'clue',
      clue: makeClue(),
      outgoingEdges: [
        edge({
          sourceType: 'clue',
          sourceId: 'clue-letter',
          targetType: 'npc',
          targetId: 'npc-marlow',
          kind: 'mentions',
        }),
      ],
      entityNameById: NAMES,
    })

    // Sanity: emitted snippets contain the wiki-link names we expect.
    expect(npcMd).toContain('[[Cell Blue]]')
    expect(npcMd).toContain('[[Site Bravo]]')
    expect(clueMd).toContain('[[Agent Marlow]]')
    expect(locationMd).toContain('[[Newark]]')
    expect(factionMd).toContain('Cell Blue')

    // Build a scenario doc that re-uses the same names. This proves the
    // export format keeps the wiki-link convention shared with import.
    const scenarioDoc = `# Scenario: Operation Reverberate

## Locations
### Newark
- **Description**: City context.

### Site Bravo
- **Description**: Abandoned warehouse.
- **Parent**: [[Newark]]

## Factions
### Cell Blue
- **Agenda**: Recover the Briefcase before the Program does.

## NPCs
### Agent Marlow
- **Profession**: Federal Agent
- **Status**: alive
- **Faction**: [[Cell Blue]]
- **Location**: [[Site Bravo]]

## Clues
### Bloody letter
- **Description**: Half-burned letter.
- **Mentions**: [[Agent Marlow]]
`
    const parsed = parseScenarioMarkdown(scenarioDoc)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    // The wiki-links emitted by export still resolve under import rules.
    const memberOf = parsed.data.edges.find(
      (e) => e.kind === 'member_of' && e.sourceName === 'Agent Marlow',
    )
    expect(memberOf).toBeDefined()
    expect(memberOf?.targetName).toBe('Cell Blue')
    const mentions = parsed.data.edges.find((e) => e.kind === 'mentions')
    expect(mentions?.targetName).toBe('Agent Marlow')
  })
})
