---
id: 023
title: Implement distinct prep and play modes
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
labels: [ui]
req-ids: [REQ-019]
---

# Implement distinct prep and play modes

## Narrative
**As** the GM at the Table
**I want** a top-level prep/play mode toggle
**So that** the screen shows me what the moment demands

## Acceptance Criteria

```gherkin
Given the application
When I toggle into play mode
Then editing affordances are de-emphasized
And primary actions (mark clue delivered, log SAN/Bond, open Cmd-K, jump to current Session) are surfaced
And the mode is persisted in localStorage and reflected in the URL (?mode=play)
When I navigate between pages
Then the mode persists
```

## REQ Traceability
- REQ-019 — Distinct prep and play modes (prep = full editing; play = read-optimized + primary actions; mode is GM-toggled)

## Implementation Notes

Mode is purely client-side; the API is mode-agnostic.

**Delivered**:
- `src/lib/mode.tsx` — `AppModeProvider` mounted in Layout. Initial mode resolves from `?mode=` URL param → localStorage `dg.mode` → `'prep'`. `setMode` writes both. `useAppMode()` + `useIsPlayMode()` (provider-tolerant — returns `false` outside provider so isolated component tests don't need to wrap).
- Header gets a small `[Prep] [Play]` button group + a "Editing dimmed" caption in play mode.
- `src/components/ui/EditOnly.tsx` — render gate primitive: children in prep, optional fallback in play.
- `EditOnly` wrapped surgically: 9 list pages' "+ New X" links, 9 detail pages' Delete button, AddBondForm + bond apply-damage forms + sanity edit/apply forms on PC page, AddNpc/AddClue forms on Scene page, ClueDetailPage's Add edge form, FactionContext's status-event remove + add-note form. Read affordances and `/new` pages stay untouched.
- Tests: 262 → 271 (+9). 5 mode hook tests (URL initial, localStorage initial, default, persistence, invalid URL), 3 EditOnly render-gate tests, 1 Layout toggle smoke.
- Test setup polyfill added for Node 25's broken built-in localStorage in jsdom — pure test-environment hygiene.

**Open follow-ups**:
- #024 — primary-actions toolbar (the second half of REQ-019: surfacing primary play actions). Marker comment in `Layout.tsx` near the toggle.
- A few intentional skips: per-edge ✕ Remove on ClueDetailPage, EntityRelationships internal Add controls (not yet audited), Sessions list view-state toggles. Revisit when #024 lands.

## Dependencies

Blocked by #009 (relationships). Independent of #013 onward.
