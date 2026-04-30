---
id: 009
title: Implement the polymorphic typed-edge table
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [data-model, domain]
req-ids: [REQ-003, REQ-015]
---

# Implement the polymorphic typed-edge table

## Narrative
**As** the Prepping GM
**I want** typed first-class relationships between entities
**So that** "show me every clue implicating Faction X" is a single query, not a search across prose

## Acceptance Criteria

```gherkin
Given the relationships table
When I create an edge {kind: 'clue→faction', source_id, target_id}
Then the edge is persisted with kind, source_type, source_id, target_type, target_id
And invalid kinds are rejected by an application-layer allowlist
Given a Clue linked to a Faction
When I view the Faction page
Then the Clue appears in an "Implicating clues" section automatically
```

## REQ Traceability
- REQ-003 — Typed first-class relationships (Clue↔NPC, Clue↔Faction, NPC↔NPC, etc.)
- REQ-015 — Entity detail surfaces relationships (foundation; UI-side completion in #018)

## Implementation Notes

Per ADR-002, polymorphic over per-pair junction tables. Reverse-ref API surfaces incoming edges per detail page.

## Dependencies

Blocked by #004, #008.
