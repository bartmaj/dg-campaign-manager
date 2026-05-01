---
id: 014
title: Implement bulk Markdown scenario import
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [import-export, domain, testing]
req-ids: [REQ-016]
---

# Implement bulk Markdown scenario import

## Narrative
**As** the Prepping GM
**I want** to import an entire published scenario from a structured Markdown document
**So that** transcribing modules does not cost more than running them

## Acceptance Criteria

```gherkin
Given a valid scenario Markdown file conforming to the documented template
When I upload it to /api/import/scenario
Then a Scenario, its Scenes, NPCs, Clues, Items, Locations, and inter-entity relationships are created in one transaction
And the import is atomic — partial imports are rejected
Given an invalid scenario Markdown file
When I upload it
Then validation errors are returned with line and field references
And no partial records are persisted
```

## REQ Traceability
- REQ-016 — Bulk import from Markdown template (atomic transactional ingest of Scenario + Scenes + NPCs + Clues + Items + Locations + relationships)

## Implementation Notes

Parser is pure TS in `Domain.mdImport`; DB write is a thin transactional wrapper. First import of a real published Arc Dream scenario is the v1 acceptance gate.

**Delivered**:
- Template documented at `docs/md-import-template.md`. H1 = scenario name; H2 sections (`## Locations`, `## NPCs`, `## Factions`, `## Items`, `## Clues`, `## Scenes`); `### Name` per entity; `- **Field**: …` lines for attributes; `[[Name]]` wiki-links resolve within the document.
- `domain/mdImport.ts` — pure-TS parser (~600 lines): two-pass, builds name→entity map first, then resolves wiki-links into edges that pass `isValidEdge` (uses existing `EDGE_RULES` — no additions needed). Returns `{ ok, data | errors }` with line/field error refs.
- `api/import/scenario.ts` — POST endpoint runs the parser then `db.transaction(...)` performs the bulk insert in deterministic order (locations → factions → npcs → items → clues → scenes → edges). Atomic; partial state rolls back. Auto-creates "Default Campaign" when none exists (mirrors `api/sessions/index.ts`).
- Scenario + Scene CRUD pages (replacing `EntityStubPage`): `domain/{scenario,scene}.ts`, API endpoints, hooks, list/new/detail pages. SceneListPage/ScenarioDetail support `?scenarioId=` filtering. SceneDetailPage shows incoming edges only (no `source='scene'` rules in EDGE_RULES).
- `src/pages/import/ImportPage.tsx` — textarea + file upload + Import button. Renders validation errors with line/field refs on 400; renders `{ scenarioId, counts }` and a link to the new scenario on success. Linked from `Layout` nav.
- Tests: 134 → 171 (+37). 25 in `domain/mdImport.test.ts` covering happy path, missing required fields, unresolved wiki-links, all relevant edge kinds, error reporting accuracy, and round-trip smoke.

**Open follow-ups**:
- Multi-line/continuation values in `- **Description**: …` (single-line only today).
- Resolved scenario name (instead of UUID) on `SceneListPage`.
- Round-trip equivalence with #015 export.
- First import of a real published Arc Dream scenario — the v1 acceptance gate — still needs to happen by the GM as a manual sign-off.

## Dependencies

Blocked by #009, #010, #008.
