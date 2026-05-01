---
id: 013
title: Implement Sessions with hybrid in-game / real-world timeline
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [data-model, ui]
req-ids: [REQ-010]
---

# Implement Sessions with hybrid in-game / real-world timeline

## Narrative
**As** the Campaign Memory Keeper
**I want** Sessions ordered by both in-game date and real-world date
**So that** I can navigate the campaign by either axis

## Acceptance Criteria

```gherkin
Given two sessions with overlapping in-game dates and distinct IRL dates
When I view the in-game timeline
Then both sessions appear at their in-game positions
When I view the real-session timeline
Then both sessions are ordered by IRL date
And both axes are stored on every Session record
```

## REQ Traceability
- REQ-010 — Session entity with hybrid timeline (real-world date + in-game date range)

## Implementation Notes

Sessions hold the substrate for REQ-011 event tagging in M3.

**Delivered**:
- Migration `drizzle/0008_tiresome_payback.sql` adds `inGameDateEnd` to `sessions` (start was already there).
- `domain/session.ts` with `sessionInputSchema`, `compareByInGame`, `compareByRealWorld` (nulls last on both axes).
- API: `api/sessions/index.ts` (GET with `?orderBy=inGame|realWorld`, POST with auto-default-campaign creation when none provided), `api/sessions/[id].ts` (GET).
- Frontend: `src/api/sessions.ts`, `src/hooks/useSessions.ts`, `src/hooks/useCreateSession.ts`. Pages in `src/pages/sessions/`: list with order toggle (Real-world / In-game), new with date inputs, detail with edge-add UI mirroring `ClueDetailPage`.
- Tests: 121 → 134 (+13). Domain coverage of dual-axis ordering, schema validation, plus list-page toggle and form smoke tests.

**Open follow-ups**:
- #023 multi-campaign UI — until then sessions span all campaigns and the auto-default-campaign helper handles new POSTs.
- Linked-events surfacing on `SessionDetailPage` (bond damage / SAN changes filtered by `sessionId`): TODO stubs in place; needs GET-handler extensions on `bond_damage_events` and `sanity-events` endpoints.
- Zod refinement to enforce `inGameDateEnd >= inGameDate`.

## Dependencies

Blocked by #004.
