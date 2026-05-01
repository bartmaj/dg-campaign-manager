/**
 * Pure-TS Markdown scenario import parser (#014, REQ-016).
 *
 * Parses a single Markdown document conforming to
 * `docs/md-import-template.md` into a normalized, validated shape ready
 * for transactional ingest.
 *
 * No DB, no React, no I/O. Errors carry 1-based line numbers and the
 * originating field name so the API can surface helpful messages.
 *
 * Design notes:
 * - Hand-written line parser. The format is regular enough that
 *   `marked`/`remark` would be overkill, and a custom parser lets us
 *   produce precise line-number errors for every bullet.
 * - Two-pass: pass 1 collects entity names per section type so that
 *   wiki-link resolution in pass 2 can validate against the full set
 *   of names regardless of declaration order.
 * - Edges are validated against `EDGE_RULES` so the parser never emits
 *   an edge the API would reject.
 */
import { z } from 'zod'
import { isValidEdge } from './edges'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ParseError = {
  line: number
  field: string
  message: string
}

export type ImportedScenario = {
  name: string
  description: string | null
}

export type ImportedLocation = {
  tempId: string
  name: string
  description: string | null
  parentName: string | null
}

export type ImportedNpc = {
  tempId: string
  name: string
  description: string | null
  profession: string | null
  status: 'alive' | 'dead' | 'missing' | 'turned'
  factionName: string | null
  locationName: string | null
  mannerisms: string | null
  voice: string | null
  secrets: string | null
  currentGoal: string | null
}

export type ImportedFaction = {
  tempId: string
  name: string
  description: string | null
  agenda: string | null
}

export type ImportedItem = {
  tempId: string
  name: string
  description: string | null
  ownerNpcName: string | null
  locationName: string | null
}

export type ImportedClue = {
  tempId: string
  name: string
  description: string | null
}

export type ImportedScene = {
  tempId: string
  name: string
  description: string | null
  orderIndex: number
}

/**
 * Edge between two imports — identified by `(sectionType, name)` pairs
 * that the API resolves to UUIDs after rows are inserted.
 */
export type ImportedEdge = {
  sourceType: 'npc' | 'item' | 'clue'
  sourceName: string
  targetType: 'npc' | 'item' | 'clue' | 'faction' | 'location' | 'scene'
  targetName: string
  kind: string
}

export type ImportedData = {
  scenario: ImportedScenario
  locations: ImportedLocation[]
  npcs: ImportedNpc[]
  factions: ImportedFaction[]
  items: ImportedItem[]
  clues: ImportedClue[]
  scenes: ImportedScene[]
  edges: ImportedEdge[]
}

export type ParseResult = { ok: true; data: ImportedData } | { ok: false; errors: ParseError[] }

// ─── Section types ──────────────────────────────────────────────────────────

const SECTION_NAMES = ['Locations', 'NPCs', 'Factions', 'Items', 'Clues', 'Scenes'] as const
type SectionName = (typeof SECTION_NAMES)[number]

type SectionKey = 'location' | 'npc' | 'faction' | 'item' | 'clue' | 'scene'

const SECTION_TO_KEY: Record<string, SectionKey> = {
  locations: 'location',
  npcs: 'npc',
  factions: 'faction',
  items: 'item',
  clues: 'clue',
  scenes: 'scene',
}

const KEY_TO_SECTION: Record<SectionKey, SectionName> = {
  location: 'Locations',
  npc: 'NPCs',
  faction: 'Factions',
  item: 'Items',
  clue: 'Clues',
  scene: 'Scenes',
}

// ─── Zod schemas (final shape validation) ───────────────────────────────────

const npcStatusSchema = z.enum(['alive', 'dead', 'missing', 'turned'])

const importedScenarioSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
})

const importedDataSchema = z.object({
  scenario: importedScenarioSchema,
  locations: z.array(z.object({ name: z.string().min(1) }).passthrough()),
  npcs: z.array(z.object({ name: z.string().min(1), status: npcStatusSchema }).passthrough()),
  factions: z.array(z.object({ name: z.string().min(1) }).passthrough()),
  items: z.array(z.object({ name: z.string().min(1) }).passthrough()),
  clues: z.array(z.object({ name: z.string().min(1) }).passthrough()),
  scenes: z.array(z.object({ name: z.string().min(1) }).passthrough()),
  edges: z.array(z.object({ kind: z.string().min(1) }).passthrough()),
})

// ─── Internal raw representation ────────────────────────────────────────────

type RawField = {
  name: string
  rawName: string
  value: string
  line: number
}

type RawEntity = {
  name: string
  headingLine: number
  fields: RawField[]
}

type RawSection = {
  key: SectionKey
  headingLine: number
  entities: RawEntity[]
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function parseScenarioMarkdown(md: string): ParseResult {
  const errors: ParseError[] = []
  const lines = md.replace(/\r\n?/g, '\n').split('\n')

  let scenarioHeadingLine = -1
  let scenarioName = ''
  let scenarioDescription: string | null = null
  const scenarioFields: RawField[] = []

  const sections: RawSection[] = []
  let currentSection: RawSection | null = null
  let currentEntity: RawEntity | null = null
  let inScenario = false

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    const lineNo = i + 1
    const trimmed = raw.trim()

    if (trimmed.length === 0) continue

    if (trimmed.startsWith('# ')) {
      if (scenarioHeadingLine !== -1) {
        errors.push({
          line: lineNo,
          field: 'heading',
          message: 'Multiple H1 headings — only one `# Scenario:` is allowed.',
        })
        continue
      }
      const match = /^#\s+Scenario\s*:\s*(.+?)\s*$/i.exec(trimmed)
      if (!match) {
        errors.push({
          line: lineNo,
          field: 'heading',
          message: 'H1 must be of the form `# Scenario: <name>`.',
        })
        continue
      }
      scenarioHeadingLine = lineNo
      scenarioName = match[1]!.trim()
      inScenario = true
      currentSection = null
      currentEntity = null
      continue
    }

    if (trimmed.startsWith('## ')) {
      if (!inScenario) {
        errors.push({
          line: lineNo,
          field: 'heading',
          message: 'Section heading appears before `# Scenario:` H1.',
        })
        continue
      }
      const sectionLabel = trimmed.slice(3).trim()
      const key = SECTION_TO_KEY[sectionLabel.toLowerCase()]
      if (!key) {
        errors.push({
          line: lineNo,
          field: 'heading',
          message: `Unknown section "${sectionLabel}". Allowed: ${SECTION_NAMES.join(', ')}.`,
        })
        continue
      }
      if (sections.some((s) => s.key === key)) {
        errors.push({
          line: lineNo,
          field: 'heading',
          message: `Duplicate "${sectionLabel}" section.`,
        })
        continue
      }
      currentSection = { key, headingLine: lineNo, entities: [] }
      sections.push(currentSection)
      currentEntity = null
      continue
    }

    if (trimmed.startsWith('### ')) {
      if (!currentSection) {
        errors.push({
          line: lineNo,
          field: 'heading',
          message: 'Entity heading (`###`) appears outside any `##` section.',
        })
        continue
      }
      const name = trimmed.slice(4).trim()
      if (name.length === 0) {
        errors.push({
          line: lineNo,
          field: 'heading',
          message: 'Empty entity heading.',
        })
        continue
      }
      const newEntity: RawEntity = { name, headingLine: lineNo, fields: [] }
      currentSection.entities.push(newEntity)
      currentEntity = newEntity
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const fieldMatch = /^[-*]\s+\*\*([^*]+?)\*\*\s*:\s*(.*)$/.exec(trimmed)
      if (!fieldMatch) {
        errors.push({
          line: lineNo,
          field: 'bullet',
          message:
            'Bullet must be of the form `- **Field**: value`. Got: ' +
            JSON.stringify(trimmed.slice(0, 80)),
        })
        continue
      }
      const rawName = fieldMatch[1]!.trim()
      const value = fieldMatch[2]!.trim()
      const field: RawField = {
        name: rawName.toLowerCase(),
        rawName,
        value,
        line: lineNo,
      }
      if (currentSection && currentEntity) {
        currentEntity.fields.push(field)
      } else if (inScenario && !currentSection) {
        scenarioFields.push(field)
      } else {
        errors.push({
          line: lineNo,
          field: rawName,
          message: 'Bullet field appears outside any entity or scenario block.',
        })
      }
      continue
    }
    // Other lines (free-text continuation) are ignored.
  }

  if (scenarioHeadingLine === -1) {
    errors.push({
      line: 1,
      field: 'heading',
      message: 'Missing `# Scenario: <name>` H1.',
    })
    return { ok: false, errors }
  }

  for (const f of scenarioFields) {
    if (f.name === 'description') {
      scenarioDescription = f.value.length === 0 ? null : f.value
    }
  }

  const sectionByKey = new Map<SectionKey, RawSection>()
  for (const s of sections) sectionByKey.set(s.key, s)

  function namesIn(key: SectionKey): Map<string, RawEntity> {
    const out = new Map<string, RawEntity>()
    const sec = sectionByKey.get(key)
    if (!sec) return out
    for (const e of sec.entities) {
      const canonical = canonicalName(e.name)
      if (out.has(canonical)) {
        errors.push({
          line: e.headingLine,
          field: 'heading',
          message: `Duplicate ${key} name "${canonical}" within ${KEY_TO_SECTION[key]} section.`,
        })
        continue
      }
      out.set(canonical, e)
    }
    return out
  }

  const locationsByName = namesIn('location')
  const npcsByName = namesIn('npc')
  const factionsByName = namesIn('faction')
  const itemsByName = namesIn('item')
  const cluesByName = namesIn('clue')
  const scenesByName = namesIn('scene')

  function resolveWikiLinks(value: string): string[] {
    const out: string[] = []
    const re = /\[\[([^\]]+)\]\]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(value)) !== null) {
      out.push(m[1]!.trim())
    }
    return out
  }

  function expectSingleWikiLink(field: RawField): string | null {
    const links = resolveWikiLinks(field.value)
    if (links.length === 0) return null
    if (links.length > 1) {
      errors.push({
        line: field.line,
        field: field.rawName,
        message: 'Expected a single wiki-link reference.',
      })
      return null
    }
    return links[0]!
  }

  function checkRef(
    field: RawField,
    name: string | null,
    table: Map<string, RawEntity>,
    targetTypeLabel: string,
  ): string | null {
    if (name === null) return null
    if (!table.has(name)) {
      errors.push({
        line: field.line,
        field: field.rawName,
        message: `Unresolved wiki-link [[${name}]] — no ${targetTypeLabel} with that name in this document.`,
      })
      return null
    }
    return name
  }

  const locations: ImportedLocation[] = []
  for (const [name, raw] of locationsByName.entries()) {
    let description: string | null = null
    let parentName: string | null = null
    for (const f of raw.fields) {
      if (f.name === 'description') description = f.value || null
      else if (f.name === 'parent') {
        const link = expectSingleWikiLink(f)
        parentName = checkRef(f, link, locationsByName, 'location')
      }
    }
    if (parentName === name) {
      errors.push({
        line: raw.headingLine,
        field: 'Parent',
        message: 'Location cannot be its own parent.',
      })
      parentName = null
    }
    locations.push({ tempId: `location:${name}`, name, description, parentName })
  }

  const factions: ImportedFaction[] = []
  for (const [name, raw] of factionsByName.entries()) {
    let description: string | null = null
    let agenda: string | null = null
    for (const f of raw.fields) {
      if (f.name === 'description') description = f.value || null
      else if (f.name === 'agenda') agenda = f.value || null
    }
    factions.push({ tempId: `faction:${name}`, name, description, agenda })
  }

  const npcs: ImportedNpc[] = []
  const edges: ImportedEdge[] = []

  for (const [name, raw] of npcsByName.entries()) {
    let description: string | null = null
    let profession: string | null = null
    let status: ImportedNpc['status'] = 'alive'
    let factionName: string | null = null
    let locationName: string | null = null
    let mannerisms: string | null = null
    let voice: string | null = null
    let secrets: string | null = null
    let currentGoal: string | null = null

    for (const f of raw.fields) {
      switch (f.name) {
        case 'description':
          description = f.value || null
          break
        case 'profession':
          profession = f.value || null
          break
        case 'mannerisms':
          mannerisms = f.value || null
          break
        case 'voice':
          voice = f.value || null
          break
        case 'secrets':
          secrets = f.value || null
          break
        case 'current goal':
        case 'goal':
          currentGoal = f.value || null
          break
        case 'status': {
          const v = f.value.toLowerCase().trim()
          const allowed: ReadonlyArray<ImportedNpc['status']> = [
            'alive',
            'dead',
            'missing',
            'turned',
          ]
          if (allowed.includes(v as ImportedNpc['status'])) {
            status = v as ImportedNpc['status']
          } else {
            errors.push({
              line: f.line,
              field: f.rawName,
              message: `Invalid NPC status "${f.value}". Allowed: alive, dead, missing, turned.`,
            })
          }
          break
        }
        case 'faction': {
          const link = expectSingleWikiLink(f)
          factionName = checkRef(f, link, factionsByName, 'faction')
          if (factionName !== null) {
            edges.push({
              sourceType: 'npc',
              sourceName: name,
              targetType: 'faction',
              targetName: factionName,
              kind: 'member_of',
            })
          }
          break
        }
        case 'location': {
          const link = expectSingleWikiLink(f)
          locationName = checkRef(f, link, locationsByName, 'location')
          if (locationName !== null) {
            edges.push({
              sourceType: 'npc',
              sourceName: name,
              targetType: 'location',
              targetName: locationName,
              kind: 'occupies',
            })
          }
          break
        }
        default:
          break
      }
    }

    npcs.push({
      tempId: `npc:${name}`,
      name,
      description,
      profession,
      status,
      factionName,
      locationName,
      mannerisms,
      voice,
      secrets,
      currentGoal,
    })
  }

  const items: ImportedItem[] = []
  for (const [name, raw] of itemsByName.entries()) {
    let description: string | null = null
    let ownerNpcName: string | null = null
    let locationName: string | null = null
    for (const f of raw.fields) {
      switch (f.name) {
        case 'description':
          description = f.value || null
          break
        case 'owner': {
          const link = expectSingleWikiLink(f)
          ownerNpcName = checkRef(f, link, npcsByName, 'NPC')
          if (ownerNpcName !== null) {
            edges.push({
              sourceType: 'item',
              sourceName: name,
              targetType: 'npc',
              targetName: ownerNpcName,
              kind: 'owned_by',
            })
          }
          break
        }
        case 'location': {
          const link = expectSingleWikiLink(f)
          locationName = checkRef(f, link, locationsByName, 'location')
          if (locationName !== null) {
            edges.push({
              sourceType: 'item',
              sourceName: name,
              targetType: 'location',
              targetName: locationName,
              kind: 'located_at',
            })
          }
          break
        }
        default:
          break
      }
    }
    items.push({ tempId: `item:${name}`, name, description, ownerNpcName, locationName })
  }

  const clues: ImportedClue[] = []
  for (const [name, raw] of cluesByName.entries()) {
    let description: string | null = null
    for (const f of raw.fields) {
      switch (f.name) {
        case 'description':
          description = f.value || null
          break
        case 'mentions': {
          const targets = resolveWikiLinks(f.value)
          for (const t of targets) {
            const ref = checkRef(f, t, npcsByName, 'NPC')
            if (ref !== null) {
              edges.push({
                sourceType: 'clue',
                sourceName: name,
                targetType: 'npc',
                targetName: ref,
                kind: 'mentions',
              })
            }
          }
          break
        }
        case 'implicates': {
          const targets = resolveWikiLinks(f.value)
          for (const t of targets) {
            const ref = checkRef(f, t, factionsByName, 'faction')
            if (ref !== null) {
              edges.push({
                sourceType: 'clue',
                sourceName: name,
                targetType: 'faction',
                targetName: ref,
                kind: 'implicates',
              })
            }
          }
          break
        }
        case 'points to': {
          const targets = resolveWikiLinks(f.value)
          for (const t of targets) {
            const ref = checkRef(f, t, locationsByName, 'location')
            if (ref !== null) {
              edges.push({
                sourceType: 'clue',
                sourceName: name,
                targetType: 'location',
                targetName: ref,
                kind: 'points_to',
              })
            }
          }
          break
        }
        case 'prerequisite of': {
          const targets = resolveWikiLinks(f.value)
          for (const t of targets) {
            if (t === name) {
              errors.push({
                line: f.line,
                field: f.rawName,
                message: 'Clue cannot be a prerequisite of itself.',
              })
              continue
            }
            const ref = checkRef(f, t, cluesByName, 'clue')
            if (ref !== null) {
              edges.push({
                sourceType: 'clue',
                sourceName: name,
                targetType: 'clue',
                targetName: ref,
                kind: 'prerequisite_of',
              })
            }
          }
          break
        }
        default:
          break
      }
    }
    clues.push({ tempId: `clue:${name}`, name, description })
  }

  const scenes: ImportedScene[] = []
  let sceneOrderIndex = 0
  for (const [name, raw] of scenesByName.entries()) {
    let description: string | null = null
    for (const f of raw.fields) {
      switch (f.name) {
        case 'description':
          description = f.value || null
          break
        case 'delivers clues': {
          const targets = resolveWikiLinks(f.value)
          for (const t of targets) {
            const ref = checkRef(f, t, cluesByName, 'clue')
            if (ref !== null) {
              edges.push({
                sourceType: 'clue',
                sourceName: ref,
                targetType: 'scene',
                targetName: name,
                kind: 'delivered_in',
              })
            }
          }
          break
        }
        default:
          break
      }
    }
    scenes.push({
      tempId: `scene:${name}`,
      name,
      description,
      orderIndex: sceneOrderIndex++,
    })
  }

  for (const e of edges) {
    if (!isValidEdge(e.sourceType, e.kind, e.targetType)) {
      errors.push({
        line: 0,
        field: 'edge',
        message: `Edge kind "${e.kind}" is not allowed for ${e.sourceType} → ${e.targetType}.`,
      })
    }
  }

  if (errors.length > 0) {
    errors.sort((a, b) => a.line - b.line)
    return { ok: false, errors }
  }

  const data: ImportedData = {
    scenario: { name: scenarioName, description: scenarioDescription },
    locations,
    npcs,
    factions,
    items,
    clues,
    scenes,
    edges,
  }

  const gate = importedDataSchema.safeParse(data)
  if (!gate.success) {
    return {
      ok: false,
      errors: gate.error.issues.map((iss) => ({
        line: 0,
        field: iss.path.join('.') || 'data',
        message: iss.message,
      })),
    }
  }

  return { ok: true, data }
}

function canonicalName(heading: string): string {
  const m = /^\d+\.\s+(.+)$/.exec(heading.trim())
  return m ? m[1]!.trim() : heading.trim()
}
