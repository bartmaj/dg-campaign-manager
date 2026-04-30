---
id: 018
title: Surface relationships and recent activity on entity detail pages
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [ui, domain]
req-ids: [REQ-015]
---

# Surface relationships and recent activity on entity detail pages

## Narrative
**As** the Campaign Memory Keeper
**I want** every entity detail page to surface incoming and outgoing relationships and recent session activity
**So that** I see the full context of any entity at a glance

## Acceptance Criteria

```gherkin
Given an NPC referenced by 3 clues and present in 2 sessions
When I open the NPC detail page
Then the 3 clues are listed under "Referenced by"
And the 2 sessions are listed under "Recent activity"
And no manual navigation is required to see them
```

## REQ Traceability
- REQ-015 — Entity detail surfaces relationships (incoming/outgoing typed relationships + recent session activity)

## Implementation Notes

Implemented via the reverse-ref API + session-tag join.

## Dependencies

Blocked by #009, #013.
