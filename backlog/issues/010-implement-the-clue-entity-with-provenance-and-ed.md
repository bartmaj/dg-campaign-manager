---
id: 010
title: Implement the Clue entity with provenance and edges
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [data-model, domain, ui]
req-ids: [REQ-009, REQ-003]
---

# Implement the Clue entity with provenance and edges

## Narrative
**As** the Prepping GM
**I want** Clues with origin Scenario and typed edges to other entities
**So that** the investigation graph is queryable from any direction

## Acceptance Criteria

```gherkin
Given a Clue with title, description, and origin Scenario
When I link the Clue to an NPC, a Faction, and a Location simultaneously
Then all three edges are persisted as typed relationships
And the Clue's detail page shows all outgoing edges grouped by target type
```

## REQ Traceability
- REQ-009 (provenance + edges half) — Clue entity with provenance, typed edges (delivery half in #025)
- REQ-003 — Typed relationships (consumed by Clue edges)

## Implementation Notes

Delivery state half lives in M3.3A.

## Dependencies

Blocked by #009.
