// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isValidEdge } from './edges'
import { parseScenarioMarkdown, type ImportedData, type ParseError } from './mdImport'

function ok(res: ReturnType<typeof parseScenarioMarkdown>): ImportedData {
  if (!res.ok) {
    throw new Error('Expected ok parse, got: ' + JSON.stringify(res.errors, null, 2))
  }
  return res.data
}

function fail(res: ReturnType<typeof parseScenarioMarkdown>): ParseError[] {
  if (res.ok) throw new Error('Expected failure, got ok')
  return res.errors
}

const COMPLETE = `# Scenario: Operation Reverberate

- **Description**: A pre-dawn raid goes sideways.

## Locations
### Newark
- **Description**: City context.

### Site Bravo
- **Description**: Abandoned warehouse.
- **Parent**: [[Newark]]

## Factions
### Cell Blue
- **Agenda**: Recover the Briefcase.

## NPCs
### Agent Marlow
- **Profession**: Federal Agent
- **Status**: alive
- **Faction**: [[Cell Blue]]
- **Location**: [[Site Bravo]]
- **Description**: A burned-out agent.
- **Mannerisms**: Chain smoker.
- **Voice**: Gravelly.
- **Secrets**: Owes the Program a favour.
- **Current goal**: Recover the briefcase.

## Items
### Forensic Briefcase
- **Description**: Locked aluminium case.
- **Owner**: [[Agent Marlow]]
- **Location**: [[Site Bravo]]

## Clues
### Bloody letter
- **Description**: Half-burned letter.
- **Mentions**: [[Agent Marlow]]
- **Implicates**: [[Cell Blue]]
- **Points to**: [[Site Bravo]]
- **Prerequisite of**: [[Coded message]]

### Coded message
- **Description**: A scrap of paper with hex digits.

## Scenes
### Briefing
- **Description**: Players meet their handler.
- **Delivers clues**: [[Bloody letter]], [[Coded message]]

### Raid
- **Description**: Things go sideways.
`

describe('parseScenarioMarkdown — happy path', () => {
  it('parses a complete document into the expected shape', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    expect(data.scenario.name).toBe('Operation Reverberate')
    expect(data.scenario.description).toBe('A pre-dawn raid goes sideways.')
    expect(data.locations.map((l) => l.name).sort()).toEqual(['Newark', 'Site Bravo'])
    expect(data.factions.map((f) => f.name)).toEqual(['Cell Blue'])
    expect(data.npcs).toHaveLength(1)
    expect(data.items).toHaveLength(1)
    expect(data.clues.map((c) => c.name).sort()).toEqual(['Bloody letter', 'Coded message'])
    expect(data.scenes.map((s) => s.name)).toEqual(['Briefing', 'Raid'])
  })

  it('assigns sequential orderIndex values to scenes', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    expect(data.scenes.map((s) => s.orderIndex)).toEqual([0, 1])
  })

  it('captures location parent references', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    const sb = data.locations.find((l) => l.name === 'Site Bravo')
    expect(sb?.parentName).toBe('Newark')
    const newark = data.locations.find((l) => l.name === 'Newark')
    expect(newark?.parentName).toBeNull()
  })

  it('parses NPC fields including mannerisms/voice/secrets/goal/status', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    const npc = data.npcs[0]!
    expect(npc.profession).toBe('Federal Agent')
    expect(npc.status).toBe('alive')
    expect(npc.factionName).toBe('Cell Blue')
    expect(npc.locationName).toBe('Site Bravo')
    expect(npc.mannerisms).toBe('Chain smoker.')
    expect(npc.voice).toBe('Gravelly.')
    expect(npc.secrets).toBe('Owes the Program a favour.')
    expect(npc.currentGoal).toBe('Recover the briefcase.')
  })

  it('produces NPC member_of and occupies edges', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    expect(
      data.edges.some(
        (e) =>
          e.sourceType === 'npc' &&
          e.kind === 'member_of' &&
          e.targetType === 'faction' &&
          e.targetName === 'Cell Blue',
      ),
    ).toBe(true)
    expect(
      data.edges.some(
        (e) =>
          e.sourceType === 'npc' &&
          e.kind === 'occupies' &&
          e.targetType === 'location' &&
          e.targetName === 'Site Bravo',
      ),
    ).toBe(true)
  })

  it('produces item owned_by and located_at edges', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    expect(data.edges.some((e) => e.sourceType === 'item' && e.kind === 'owned_by')).toBe(true)
    expect(data.edges.some((e) => e.sourceType === 'item' && e.kind === 'located_at')).toBe(true)
  })

  it('produces clue → npc/faction/location/clue edges', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    const kinds = data.edges
      .filter((e) => e.sourceType === 'clue' && e.sourceName === 'Bloody letter')
      .map((e) => `${e.kind}/${e.targetType}`)
      .sort()
    expect(kinds).toContain('mentions/npc')
    expect(kinds).toContain('implicates/faction')
    expect(kinds).toContain('points_to/location')
    expect(kinds).toContain('prerequisite_of/clue')
  })

  it('produces clue→scene delivered_in edges from "Delivers clues" field', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    const delivered = data.edges.filter(
      (e) => e.kind === 'delivered_in' && e.sourceType === 'clue' && e.targetType === 'scene',
    )
    expect(delivered).toHaveLength(2)
    expect(delivered.map((e) => `${e.sourceName}->${e.targetName}`).sort()).toEqual([
      'Bloody letter->Briefing',
      'Coded message->Briefing',
    ])
  })

  it('every produced edge passes isValidEdge', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    for (const e of data.edges) {
      expect(isValidEdge(e.sourceType, e.kind, e.targetType)).toBe(true)
    }
  })
})

describe('parseScenarioMarkdown — robustness', () => {
  it('tolerates trailing newlines and mixed bullet markers', () => {
    const md = `# Scenario: Mixed\n\n* **Description**: Hi.\n\n## Locations\n### A\n- **Description**: yo.\n\n\n`
    const data = ok(parseScenarioMarkdown(md))
    expect(data.scenario.description).toBe('Hi.')
    expect(data.locations).toHaveLength(1)
  })

  it('treats field names case-insensitively', () => {
    const md = `# Scenario: Case\n## NPCs\n### Bob\n- **DESCRIPTION**: hi\n- **Status**: ALIVE\n`
    const data = ok(parseScenarioMarkdown(md))
    expect(data.npcs[0]?.description).toBe('hi')
    expect(data.npcs[0]?.status).toBe('alive')
  })

  it('strips leading enumeration prefix from scene heading and uses canonical name', () => {
    const md = `# Scenario: Numbered\n## Scenes\n### 1. Briefing\n- **Description**: x\n### 2. Raid\n- **Description**: y\n## Clues\n### A clue\n- **Description**: c\n`
    const md2 = md.replace(
      '## Clues',
      '## Scenes (continued)\n### 3. Aftermath\n- **Description**: z\n## Clues',
    )
    // Use the simpler form to confirm canonical naming works.
    const data = ok(parseScenarioMarkdown(md))
    expect(data.scenes.map((s) => s.name)).toEqual(['Briefing', 'Raid'])
    // duplicate-section guard catches the second `## Scenes`
    const dup = parseScenarioMarkdown(md2)
    expect(dup.ok).toBe(false)
  })
})

describe('parseScenarioMarkdown — error reporting', () => {
  it('rejects a missing H1 with a clear error', () => {
    const errs = fail(parseScenarioMarkdown('## Locations\n### A\n'))
    expect(errs.some((e) => /missing.*scenario.*h1/i.test(e.message))).toBe(true)
  })

  it('reports unresolved wiki-link with line and field', () => {
    const md =
      '# Scenario: X\n## NPCs\n### Bob\n- **Faction**: [[Ghost Faction]]\n## Factions\n### Real\n- **Agenda**: y\n'
    const errs = fail(parseScenarioMarkdown(md))
    const e = errs.find((x) => x.message.includes('Ghost Faction'))
    expect(e).toBeDefined()
    expect(e?.line).toBe(4)
    expect(e?.field).toBe('Faction')
  })

  it('rejects unknown section heading', () => {
    const md = '# Scenario: X\n## Mysteries\n### A\n'
    const errs = fail(parseScenarioMarkdown(md))
    expect(errs.some((e) => /Unknown section/.test(e.message))).toBe(true)
  })

  it('rejects a duplicate entity name within a section', () => {
    const md =
      '# Scenario: X\n## NPCs\n### Bob\n- **Description**: a\n### Bob\n- **Description**: b\n'
    const errs = fail(parseScenarioMarkdown(md))
    expect(errs.some((e) => /Duplicate npc name/.test(e.message))).toBe(true)
  })

  it('rejects an invalid NPC status value', () => {
    const md = '# Scenario: X\n## NPCs\n### Bob\n- **Status**: zombie\n'
    const errs = fail(parseScenarioMarkdown(md))
    expect(errs.some((e) => /Invalid NPC status/.test(e.message))).toBe(true)
  })

  it('rejects malformed bullet syntax with a precise line number', () => {
    const md = '# Scenario: X\n## NPCs\n### Bob\n- Description: oops missing bold\n'
    const errs = fail(parseScenarioMarkdown(md))
    expect(errs[0]?.line).toBe(4)
    expect(errs[0]?.field).toBe('bullet')
  })

  it('rejects a self-referential clue prerequisite', () => {
    const md = '# Scenario: X\n## Clues\n### Loop\n- **Prerequisite of**: [[Loop]]\n'
    const errs = fail(parseScenarioMarkdown(md))
    expect(errs.some((e) => /prerequisite of itself/i.test(e.message))).toBe(true)
  })

  it('rejects a self-referential location parent', () => {
    const md = '# Scenario: X\n## Locations\n### Newark\n- **Parent**: [[Newark]]\n'
    const errs = fail(parseScenarioMarkdown(md))
    expect(errs.some((e) => /own parent/i.test(e.message))).toBe(true)
  })

  it('reports multiple errors sorted by line number', () => {
    const md = `# Scenario: X
## NPCs
### Bob
- **Status**: weird
- **Faction**: [[Missing]]
`
    const errs = fail(parseScenarioMarkdown(md))
    expect(errs.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < errs.length; i++) {
      expect(errs[i]!.line).toBeGreaterThanOrEqual(errs[i - 1]!.line)
    }
  })
})

describe('parseScenarioMarkdown — round-trip smoke', () => {
  it('produces a payload whose entity names are stable string identifiers (round-trip surface)', () => {
    const data = ok(parseScenarioMarkdown(COMPLETE))
    // Smoke test for #015: every wiki-link reference in COMPLETE is
    // expressed in the parsed output as a (sourceName, targetName) pair
    // by name. Names are the round-trip identity.
    for (const e of data.edges) {
      expect(typeof e.sourceName).toBe('string')
      expect(typeof e.targetName).toBe('string')
    }
    // tempIds embed the canonical name, so naming is stable across re-parse.
    const data2 = ok(parseScenarioMarkdown(COMPLETE))
    expect(data.edges).toEqual(data2.edges)
  })
})

describe('parseScenarioMarkdown — empty/edge cases', () => {
  it('accepts a minimal scenario with no sections', () => {
    const data = ok(parseScenarioMarkdown('# Scenario: Bare\n'))
    expect(data.scenario.name).toBe('Bare')
    expect(data.locations).toHaveLength(0)
    expect(data.scenes).toHaveLength(0)
  })

  it('accepts an empty section without entities', () => {
    const data = ok(parseScenarioMarkdown('# Scenario: X\n## NPCs\n'))
    expect(data.npcs).toHaveLength(0)
  })

  it('does not emit edges when wiki-link fields are absent', () => {
    const data = ok(
      parseScenarioMarkdown('# Scenario: X\n## NPCs\n### Bob\n- **Description**: hi\n'),
    )
    expect(data.edges).toHaveLength(0)
  })
})
