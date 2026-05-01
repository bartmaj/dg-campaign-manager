---
id: 017
title: Implement list views with filtering per entity type
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [ui, search]
req-ids: [REQ-014]
---

# Implement list views with filtering per entity type

## Narrative
**As** the Prepping GM
**I want** every entity list filterable by type-appropriate facets
**So that** I can narrow to "all NPCs in Faction X" or "all clues in Scenario Y" instantly

## Acceptance Criteria

```gherkin
Given the NPC list
When I filter by faction
Then only NPCs of that faction are shown
Given any entity list
When I apply type-appropriate filters (faction, status, location, scenario)
Then the visible records match the filter set
```

## REQ Traceability
- REQ-014 — List views with filtering (per entity type with type-appropriate facets)

## Implementation Notes

Server filters on indexed columns; TanStack Query caches per filter key.

**Delivered**:
- All 9 list endpoints in `api/_handlers/` accept type-appropriate filter query params, composed additively via Drizzle `and(...)`. Free-text `q` matches `name` via case-insensitive `LIKE`.
- Per-entity filter shapes:
  - NPCs: `factionId`, `locationId`, `status`, `q`
  - Clues: `originScenarioId`, `q`
  - Items: `locationId`, `ownerNpcId`, `q`
  - Locations: `parentLocationId`, `q`
  - Scenes: `scenarioId`, `q`
  - Factions / PCs / Scenarios / Sessions: `q`
- Frontend: every typed wrapper accepts a filter, hooks include the filter in their query keys (`[entity, 'list', filter ?? {}]`). Mutation hooks invalidate the `lists()` namespace so all filter variants refetch.
- `src/components/FilterBar/FilterBar.tsx` — small config-driven row of text/select inputs. Used by all 9 list pages with per-page configs.
- Tests: 210 → 217 (+7). 3 FilterBar smokes, 2 NpcListPage filter tests, 2 ClueListPage filter tests.

**Open follow-ups**:
- URL-state binding for filters (deliberately deferred).
- Server pagination (`limit`/`offset`) — current 200/500-row caps.
- Sessions scenario filter via session→scenario edge join.
- Picker UX for `locationId` / `ownerNpcId` / `parentLocationId` (currently raw text inputs; faction & scenario already use dropdowns).
- Migrate `useScenes` callers to the filter-object form and drop the string-overload backward-compat.

## Dependencies

Blocked by #004, #008.
