---
id: 025
title: Implement the clue delivery flow
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
labels: [domain, ui]
req-ids: [REQ-009]
---

# Implement the clue delivery flow

## Narrative
**As** the GM at the Table
**I want** to mark a clue delivered to specific PCs in a specific Session
**So that** I can answer "what do players know?" instantly

## Acceptance Criteria

```gherkin
Given a Clue not yet delivered
When I mark it delivered in Session 7 to PCs A and B
Then the Clue's delivery state shows session-7 plus recipient PCs
And the Session 7 page lists the clue under "Delivered clues"
And the operation is append-only — un-delivering creates a corrective event rather than mutating history
```

## REQ Traceability
- REQ-009 (delivery half) — Clue delivery tracking (which Sessions delivered the clue and to which PCs)

## Implementation Notes

Triggers event-tag stamping on the active Session.

**Delivered**:
- Migration `drizzle/0010_polite_green_goblin.sql` adds `clue_delivery_events` (clueId FK cascade, sessionId FK cascade, kind `delivered`/`undelivered`, pcIds JSON, optional note, appliedAt). Append-only — never deleted, never updated.
- `domain/clueDelivery.ts` — Zod input schema (delivered requires ≥1 pc; undelivered allows empty), `computeDeliveryState(events)` returns a Map keyed by sessionId reflecting current state after replaying the history.
- New routes (63 → 66): `GET /clues/:id/delivery` returning `{ events, currentState }`, `POST /clues/:id/delivery` appending an event, `GET /sessions/:id/delivered-clues` for the per-session rollup.
- Frontend hooks: `useClueDelivery`, `useCreateClueDeliveryEvent`, `useSessionDeliveredClues`.
- ClueDetailPage gets a Delivery card (timeline + EditOnly Mark-delivered/Mark-undelivered form). SessionDetailPage gets a Delivered clues card.
- PlayActionsToolbar's clue-delivered popover now uses the new flow — the raw `delivered_in` edge hack and TODO(#025) removed.
- Tests: 280 → 291 (+11).

**Open follow-ups**:
- Pre-#025 hack edges (`clue→scene 'delivered_in'` with `notes: "session:<id>"`) are still in the DB. Inert — a future sweep could replay them as proper delivery events or drop them.
- Toolbar popover only handles `delivered`. Undeliver-from-current-session at the table is a small extension if needed.

## Dependencies

Blocked by #010, #013, #024.
