# Scenario Markdown Import Template (REQ-016, issue #014)

The bulk import endpoint (`POST /api/import/scenario`) accepts a single
Markdown document describing one Scenario plus all of its Locations,
NPCs, Factions, Items, Clues, and Scenes. The document is parsed with
the rules below; references between entities use a wiki-link syntax
(`[[Name]]`). All inserts run in one libSQL transaction — partial
imports are rejected.

This format is also the **export target** for #015 (round-trippable).

## Document shape

```
# Scenario: <Scenario Name>

<!-- Optional scenario fields as bullets directly under the H1 -->
- **Description**: One-line scenario hook or overview. Multi-paragraph
  prose is supported — wrap continuation lines as you like.

## Locations
### <Location Name>
- **Description**: …
- **Parent**: [[Other Location]]

## NPCs
### <NPC Name>
- **Profession**: …
- **Status**: alive | dead | missing | turned
- **Faction**: [[Faction Name]]
- **Location**: [[Location Name]]
- **Description**: …
- **Mannerisms**: …
- **Voice**: …
- **Secrets**: …
- **Current goal**: …

## Factions
### <Faction Name>
- **Description**: …
- **Agenda**: …

## Items
### <Item Name>
- **Description**: …
- **Owner**: [[NPC Name]]
- **Location**: [[Location Name]]

## Clues
### <Clue Name>
- **Description**: …
- **Mentions**: [[NPC Name]]
- **Implicates**: [[Faction Name]]
- **Points to**: [[Location Name]]
- **Prerequisite of**: [[Other Clue]]

## Scenes
### <Scene Name>
- **Description**: …
- **Delivers clues**: [[Clue A]], [[Clue B]]
```

## Rules

1. **Section headings** are H2 (`##`). Allowed section names (case
   insensitive, plural): `Locations`, `NPCs`, `Factions`, `Items`,
   `Clues`, `Scenes`. Unknown sections produce a validation error.
2. **Entities** within a section are H3 (`###`). The H3 text is the
   entity's `name` and is used as the wiki-link target.
3. **Fields** under each entity are list items of the form
   `- **Field Name**: value`. Field names are case-insensitive. Unknown
   fields are ignored (forward-compatible). Required fields per type
   are listed below.
4. **Wiki-links** `[[Name]]` resolve to an entity defined elsewhere in
   the same document. Resolution is **case-sensitive** within the
   appropriate section type for that field. Unresolved links produce a
   validation error pointing at the source line and field.
5. **Multiple references** in one field: comma-separated list of
   wiki-links. Example: `- **Delivers clues**: [[Clue A]], [[Clue B]]`.
6. **Whitespace tolerance**: leading/trailing whitespace on lines is
   trimmed; blank lines between entries are fine; mixed `-`/`*` bullets
   are accepted.
7. **Scenario H1** must start with `# Scenario:` followed by the name.
   Optional bullet fields directly under the H1 (before any `##`)
   apply to the scenario itself.

## Required fields

| Type     | Required          |
|----------|-------------------|
| Scenario | name (from H1)    |
| Location | name              |
| NPC      | name              |
| Faction  | name              |
| Item     | name              |
| Clue     | name              |
| Scene    | name              |

All other fields are optional. Names must be unique within their
section type.

## Wiki-link field resolution

Each field name maps to a target entity type (and an edge kind, where
applicable). Edges produced are checked against `EDGE_RULES`
(`domain/edges.ts`).

| Field on …        | Resolves as …                                | Edge kind            |
|-------------------|----------------------------------------------|----------------------|
| Location.Parent   | Location (sets `parentLocationId`)           | (no edge)            |
| NPC.Faction       | Faction (sets `factionId`)                   | `npc → faction member_of` |
| NPC.Location      | Location (sets `locationId`)                 | `npc → location occupies` |
| Item.Owner        | NPC (sets `ownerNpcId`)                      | `item → npc owned_by` |
| Item.Location     | Location (sets `locationId`)                 | `item → location located_at` |
| Clue.Mentions     | NPC                                          | `clue → npc mentions` |
| Clue.Implicates   | Faction                                      | `clue → faction implicates` |
| Clue.Points to    | Location                                     | `clue → location points_to` |
| Clue.Prerequisite of | Clue                                      | `clue → clue prerequisite_of` |
| Scene.Delivers clues | Clue                                      | `clue → scene delivered_in` (inverted) |

If a wiki-link relation is not in `EDGE_RULES`, validation fails with a
clear error.

## Error reporting

A 400 from `/api/import/scenario` returns:

```json
{
  "errors": [
    { "line": 23, "field": "Owner", "message": "Unresolved wiki-link [[Unknown NPC]]." }
  ]
}
```

`line` is 1-based; `field` is the bullet field name where the issue
arose (or the section/entity heading line for structural errors).

## Example

```markdown
# Scenario: Operation Reverberate

- **Description**: A pre-dawn raid on a Newark warehouse goes sideways.

## Locations
### Newark
- **Description**: City context.

### Site Bravo
- **Description**: An abandoned warehouse on the edge of Newark.
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
- **Description**: A burned-out senior agent.

## Items
### Forensic Briefcase
- **Description**: Locked aluminium case, FBI seal.
- **Owner**: [[Agent Marlow]]
- **Location**: [[Site Bravo]]

## Clues
### Bloody letter
- **Description**: Half-burned letter pinned to a corkboard.
- **Mentions**: [[Agent Marlow]]
- **Implicates**: [[Cell Blue]]
- **Points to**: [[Site Bravo]]

## Scenes
### Briefing
- **Description**: Players meet their handler.
- **Delivers clues**: [[Bloody letter]]
```
