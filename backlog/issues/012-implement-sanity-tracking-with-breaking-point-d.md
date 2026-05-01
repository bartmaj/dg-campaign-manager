---
id: 012
title: Implement Sanity tracking with breaking-point detection
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [data-model, domain, ui]
req-ids: [REQ-007]
---

# Implement Sanity tracking with breaking-point detection

## Narrative
**As** the GM at the Table
**I want** SAN tracked as current/max with breaking points, adapted-to, disorders, and change log
**So that** SAN loss is mechanically faithful and breaking-point crossings are flagged

## Acceptance Criteria

```gherkin
Given a PC with SAN 50/65 and breaking-point thresholds defined
When I apply a 5-point SAN loss with a source
Then current SAN is 45
And the loss event is logged with timestamp and source
Given a SAN loss that crosses a breaking-point threshold
When the mutation is applied
Then the system flags the breaking-point crossing
```

## REQ Traceability
- REQ-007 — Sanity tracking (current SAN, maximum SAN, breaking points, adapted-to, disorders, SAN change log)

## Implementation Notes

Breaking-point detection lives in `Domain.sanity` for unit testability (ADR-005).

**Delivered**:
- Migration `drizzle/0007_noisy_blackheart.sql`: new `san_change_events` table; `pcs.adapted_to` column. `breakingPoints` retyped to `number[]` in TS (no schema change — JSON column was already there from #005).
- `domain/sanity.ts` — pure TS: `applySanityChange(currentSan, delta, opts)`, `detectCrossedThresholds(prev, next, thresholds)` with the "leaving the threshold" semantics (`nextSan < t <= prevSan` downward), `summarizeSanHistory(events)`, `sanChangeInputSchema`.
- API: `api/pcs/[id]/sanity.ts` POST applies SAN change in a libSQL transaction (insert event + update `sanity_current`); response carries `crossedThresholds`. `api/pcs/[id]/sanity-events.ts` GET. PATCH `/api/pcs/:id` accepts narrow updates of `breakingPoints` / `sanityDisorders` / `adaptedTo`.
- Frontend: `src/api/sanity.ts`, `src/hooks/useSanity.ts`, `useApplySanityChange`, `usePatchPcSanityLists`. PcDetailPage gains a Sanity section with progress bar, list editors for breaking points / disorders / adapted-to, single-magnitude delta input + Loss/Gain buttons, last-5 events with crossed-threshold badges, and a prominent flash banner naming crossed thresholds (auto-dismiss after 6s, plus manual close).
- Tests: 97 → 121 (+24). 21 in `domain/sanity.test.ts`, 3 added in `PcDetailPage.test.tsx`.

**Open follow-ups**:
- Direct "Add disorder" action in the breaking-point flash (currently advisory).
- Sanity therapy mechanics (BP regen, structured therapy events) — explicitly out of scope.
- The PC's `bp` derived attribute (singular Breaking Point = POW × 4) is distinct from this story's `breakingPoints` thresholds list — worth a doc/comment pass to disambiguate.

## Dependencies

Blocked by #005.
