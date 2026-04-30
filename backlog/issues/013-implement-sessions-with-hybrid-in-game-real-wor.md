---
id: 013
title: Implement Sessions with hybrid in-game / real-world timeline
milestone: M2
unit: M2 — Core Workbench
status: not-started
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

## Dependencies

Blocked by #004.
