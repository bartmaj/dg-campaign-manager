---
id: 023
title: Implement distinct prep and play modes
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
labels: [ui]
req-ids: [REQ-019]
---

# Implement distinct prep and play modes

## Narrative
**As** the GM at the Table
**I want** a top-level prep/play mode toggle
**So that** the screen shows me what the moment demands

## Acceptance Criteria

```gherkin
Given the application
When I toggle into play mode
Then editing affordances are de-emphasized
And primary actions (mark clue delivered, log SAN/Bond, open Cmd-K, jump to current Session) are surfaced
And the mode is persisted in localStorage and reflected in the URL (?mode=play)
When I navigate between pages
Then the mode persists
```

## REQ Traceability
- REQ-019 — Distinct prep and play modes (prep = full editing; play = read-optimized + primary actions; mode is GM-toggled)

## Implementation Notes

Mode is purely client-side; the API is mode-agnostic.

## Dependencies

Blocked by #009 (relationships). Independent of #013 onward.
