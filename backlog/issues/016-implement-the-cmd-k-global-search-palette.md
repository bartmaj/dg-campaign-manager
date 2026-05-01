---
id: 016
title: Implement the Cmd-K global search palette
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [search, ui, performance]
req-ids: [REQ-013, REQ-N01]
---

# Implement the Cmd-K global search palette

## Narrative
**As** the GM at the Table
**I want** a Cmd-K palette searching all entity types in under a second
**So that** I never lose tempo at the table

## Acceptance Criteria

```gherkin
Given a dataset with 1,000 entities of mixed types
When I press Cmd-K and type 3 or more characters
Then matching entities across all types appear in under 1 second
And selecting a result navigates to its detail page
And the index refreshes after every successful create or update mutation
```

## REQ Traceability
- REQ-013 — Cmd-K global search palette (keyboard-driven, all entity types)
- REQ-N01 — Cmd-K latency (<1s for 1,000-entity datasets)

## Implementation Notes

Per ADR-003, server exposes `/api/search/index`; SPA holds the index in memory and runs in-memory fuzzy match.

**Delivered**:
- `api/search/index.ts` — GET endpoint. One parallel fan-out per entity table, then a parallel batch of `WHERE id IN (…)` lookups for FK-derived subtitles (NPC.faction, Item.owner+location, Scene.scenario, Clue.originScenario, Bond.pc+target). Stable `(type, name)` ordering. `Cache-Control: no-store`.
- `domain/searchMatch.ts` — pure-TS fuzzy matcher (subsequence + substring tiers, prefix/word-prefix bonus, contiguity bonus, gap penalty, stable secondary sort). Returns `matchedRanges` for `<mark>` highlighting. Perf budget: ~5–15 ms / 1k items locally — comfortable margin under the 1s AC.
- `src/hooks/useSearchIndex.ts` — `useSearchIndex()` + exported `searchIndexQueryKey`; `staleTime: 30s`. Every existing mutation hook (15 of them: useCreate*, useDelete*, useApply*, usePatch*) now invalidates the search index in onSuccess.
- `src/components/CmdK/CmdKPalette.tsx` (+ `useCmdKShortcut.tsx`, `entityRoutes.ts`, `cmdk.css`) — modal palette mounted in `Layout.tsx`. Cmd-K / Ctrl-K toggle (skips when focus is in another editable element). 3-char minimum hint. Type chip + name (with `<mark>` highlights) + subtitle. ArrowUp/Down to navigate, Enter to select, Esc to close. Routes to the entity's detail page (bonds redirect to `/pcs` since there's no /bonds/:id).
- Tests: 194 → 210 (+16). 10 in `domain/searchMatch.test.ts` (incl. perf assertion: 1k items × 3-char query < 200ms), 5 in `CmdKPalette.test.tsx`, 1 layout smoke.

**Open follow-ups**:
- Bond detail navigation: thread `pcId` onto bond `SearchIndexItem` so bonds route to `/pcs/{pcId}` instead of `/pcs`.
- Pre-lowercase index names once on load (currently per-match) — easy speedup at 5k+ entities.
- Optional `ETag` on the search-index response if first-load latency becomes noticeable.

## Dependencies

Blocked by #004, #008.
