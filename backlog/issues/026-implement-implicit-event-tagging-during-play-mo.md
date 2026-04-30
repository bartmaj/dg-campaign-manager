---
id: 026
title: Implement implicit event tagging during play mode
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
labels: [domain]
req-ids: [REQ-011]
---

# Implement implicit event tagging during play mode

## Narrative
**As** the GM at the Table
**I want** play-mode mutations to auto-stamp the active Session
**So that** session reports build themselves while I run the game

## Acceptance Criteria

```gherkin
Given play mode with an active Session set
When I mark a clue delivered, encounter an NPC, apply SAN loss, or apply Bond damage
Then an event-tag row is appended for the active Session
And the action requires no extra clicks beyond the mutation itself
```

## REQ Traceability
- REQ-011 (substrate) — Auto-derived session report substrate (session-scoped mutations stamp the active Session id)

## Implementation Notes

Active Session id lives in app-shell state; auto-stamped on every relevant API call.

## Dependencies

Blocked by #023, #025, #011, #012.
