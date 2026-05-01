---
id: 010
title: Implement the Clue entity with provenance and edges
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [data-model, domain, ui]
req-ids: [REQ-009, REQ-003]
---

# Implement the Clue entity with provenance and edges

## Narrative
**As** the Prepping GM
**I want** Clues with origin Scenario and typed edges to other entities
**So that** the investigation graph is queryable from any direction

## Acceptance Criteria

```gherkin
Given a Clue with title, description, and origin Scenario
When I link the Clue to an NPC, a Faction, and a Location simultaneously
Then all three edges are persisted as typed relationships
And the Clue's detail page shows all outgoing edges grouped by target type
```

## REQ Traceability
- REQ-009 (provenance + edges half) — Clue entity with provenance, typed edges (delivery half in #025)
- REQ-003 — Typed relationships (consumed by Clue edges)

## Implementation Notes

Delivery state half lives in M3.3A.

**Delivered**:
- Schema: `originScenarioId` (FK to scenarios, on-delete set null) added to `clues` (migration `drizzle/0005_unknown_kate_bishop.sql`).
- `domain/clue.ts` with `clueInputSchema`.
- API endpoints in `api/clues/`. Frontend wrappers, `useClues`/`useCreateClue` hooks.
- Pages in `src/pages/clues/`: list, new, detail. Detail page shows origin scenario link + outgoing edges grouped by target type, with a per-row "✕ Remove" button.
- "Add edge" inline form on the detail page driven by `EDGE_RULES` and `kindsForSource('clue', selectedTargetType)` — selects refresh based on the user's choice. Plain `useState` (not RHF) since the kind dropdown depends on the target-type dropdown.
- Tests: 70 → 78 (+8).

**Open follow-ups**:
- Picker UX for `originScenarioId` and edge `targetId` — currently raw text/UUID inputs.
- #025 — clue delivery state (`delivered_in` edges with per-session ledger).
- Resolved scenario name on `ClueListPage` once a scenarios list endpoint exists (#014).
- Clue edit/delete (only edge-removal is wired here).

## Dependencies

Blocked by #009.
