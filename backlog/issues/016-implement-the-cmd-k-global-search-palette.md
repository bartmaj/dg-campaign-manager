---
id: 016
title: Implement the Cmd-K global search palette
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [search, ui, performance]
req-ids: [REQ-013, REQ-N01]
---

# Implement the Cmd-K global search palette

## Narrative
**As** the GM at the Table
**I want** a Cmd-K palette searching all entity types in under a second
**So that** I never lose tempo at the table

## Acceptance Criteria

```gherkin
Given a dataset with 1,000 entities of mixed types
When I press Cmd-K and type 3 or more characters
Then matching entities across all types appear in under 1 second
And selecting a result navigates to its detail page
And the index refreshes after every successful create or update mutation
```

## REQ Traceability
- REQ-013 — Cmd-K global search palette (keyboard-driven, all entity types)
- REQ-N01 — Cmd-K latency (<1s for 1,000-entity datasets)

## Implementation Notes

Per ADR-003, server exposes `/api/search/index`; SPA holds the index in memory and runs in-memory fuzzy match.

## Dependencies

Blocked by #004, #008.
