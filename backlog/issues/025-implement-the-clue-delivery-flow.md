---
id: 025
title: Implement the clue delivery flow
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
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

## Dependencies

Blocked by #010, #013, #024.
