---
id: 032
title: Run an end-to-end live session through the tool
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
labels: [testing, ops]
req-ids: []
---

# Run an end-to-end live session through the tool

## Narrative
**As** the GM at the Table (and the v1 acceptance arbiter)
**I want** to run a full live Delta Green session of an imported scenario without falling back to other notes
**So that** v1 is observably done by the only criterion that matters

## Acceptance Criteria

```gherkin
Given an imported published Arc Dream scenario and a real player group
When I run a live session through the tool
Then char sheets, clue lookups, NPC retrieval, SAN/Bond logging, and the session report are handled in the tool
And I do not open Obsidian, Notion, or scattered notes for primary campaign tracking during the session
And post-session, all P0 issues surfaced are closed; P1 issues are documented with workarounds
```

## REQ Traceability
- §6.2 acceptance — composite over all Must-Haves (the v1 launch gate; PRD Verification & Validation)

## Implementation Notes

This story is the v1 launch gate. Wall-clock-bound — players must be available the chosen weekend.

## Dependencies

Blocked by all M1 + M2 + M3 stories. Specifically: #014 (real scenario must be importable), #024–#027 (play-mode + session report functional), #031 (cross-browser pass passed).
