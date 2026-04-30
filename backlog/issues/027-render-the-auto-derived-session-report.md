---
id: 027
title: Render the auto-derived session report
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
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

## Dependencies

Blocked by #026.
