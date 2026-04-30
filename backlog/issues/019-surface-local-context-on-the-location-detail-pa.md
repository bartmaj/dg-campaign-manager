---
id: 019
title: Surface local context on the Location detail page
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [ui, domain]
req-ids: [REQ-024]
---

# Surface local context on the Location detail page

## Narrative
**As** the GM at the Table
**I want** a Location page to show every clue, NPC, item, and prior session event tied to that location
**So that** I have a single read-out when players arrive somewhere

## Acceptance Criteria

```gherkin
Given a Location with linked clues, present NPCs, items at the location, and prior session events
When I open the Location at the table
Then all four panels (clues, NPCs, items, session events) are visible
And no navigation is required to see any of them
```

## REQ Traceability
- REQ-024 (full) — Location entity surfaces local context (linked clues, present NPCs, items at the location, prior session events)

## Implementation Notes

Joins relationships + session-tag rows; same pattern as REQ-015.

## Dependencies

Blocked by #018.
