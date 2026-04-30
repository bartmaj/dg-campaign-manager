---
id: 028
title: Export player-safe Markdown handouts from a Session
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
labels: [import-export, domain]
req-ids: [REQ-012]
---

# Export player-safe Markdown handouts from a Session

## Narrative
**As** the GM at the Table
**I want** a player-safe Markdown handout from any Session
**So that** I can share recap content with players without leaking GM-only notes

## Acceptance Criteria

```gherkin
Given a Session with mixed GM-only and player-safe notes
When I export a handout
Then only player-safe content is included (delivered clues, named NPCs, locations visited, GM-flagged player-safe notes)
And GM-only fields and unflagged content are excluded
```

## REQ Traceability
- REQ-012 — Player handout export from session (player-safe Markdown only)

## Implementation Notes

Filter rules live in `Domain.mdExport.handout`.

## Dependencies

Blocked by #027, #015.
