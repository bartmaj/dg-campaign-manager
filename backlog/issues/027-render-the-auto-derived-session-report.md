---
id: 027
title: Render the auto-derived session report
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
labels: [ui, domain]
req-ids: [REQ-011]
---

# Render the auto-derived session report

## Narrative
**As** the Campaign Memory Keeper
**I want** a Session page that auto-builds an event log from tagged activity
**So that** session recap is a side effect of running the session

## Acceptance Criteria

```gherkin
Given a Session with 2 clues delivered, 3 NPCs encountered, 1 scene played, and SAN/Bond changes applied during it
When I open the Session page
Then the structured event log lists all tagged events with links to source entities
And a freeform notes section is editable separately
And both sections persist independently
```

## REQ Traceability
- REQ-011 — Auto-derived session report (structured event log + freeform notes; both saved separately)

## Implementation Notes

Structured log never overwrites freeform notes.

**Delivered**:
- Migration `drizzle/0012_glossy_power_pack.sql` adds `sessions.notes` (separate from the existing one-line `description`).
- New routes (69 → 71): `GET /sessions/:id/report` returns a `SessionReport` with chronologically-sorted unified items across the four tagged-event tables (clue deliveries, NPC encounters, bond damage, SAN changes), names batched server-side; `PATCH /sessions/:id` accepts narrow `{ name?, description?, notes? }` updates.
- Frontend: `useSessionReport`, `usePatchSession`. Each session-stamping mutation hook now invalidates the per-session report key after success.
- `SessionDetailPage` replaces the old Delivered-clues / NPCs-encountered / TODO bonds-this-session / TODO SAN-this-session cards with one Event log Card driven by `useSessionReport`. Empty state copy points the GM to the play-mode toolbar / Cmd-K. A separate Notes Card holds the freeform field; `EditOnly`-gated edit affordance, but the textarea is always functional in prep mode and reads as `Prose` in play.
- Tests: 301 → 304 (+3): empty event log, mixed-kind row rendering, notes-form patch fires.

**Open follow-ups**:
- #028 player-handout export — `SessionReport` is a stable wire shape; can render either client-side or via a `/sessions/:id/report.md` mirror.
- Old `/sessions/:id/delivered-clues` and `/sessions/:id/encountered-npcs` endpoints + hooks linger as part of the public API surface; candidates for cleanup if no future caller appears.

## Dependencies

Blocked by #026.
