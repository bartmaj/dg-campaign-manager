---
id: 004
title: Define the typed entity model
milestone: M1
unit: M1 — Foundation
status: not-started
labels: [data-model, domain]
req-ids: [REQ-001, REQ-002]
---

# Define the typed entity model

## Narrative
**As** the Prepping GM
**I want** Scenario, Scene, NPC, PC, Faction, Location, and Item entities with stable schemas
**So that** every campaign concept has structured fields and routing

## Acceptance Criteria

```gherkin
Given a fresh campaign
When I open any of: Scenario, Scene, NPC, PC, Faction, Location, Item
Then the type has its own create/list/detail pages
And each schema is defined once in Drizzle and reflected in TypeScript types
Given a Scenario S with a Scene X
When I link a Clue to X (in M2)
Then the Clue's relationships show Scene X, not just Scenario S
```

## REQ Traceability
- REQ-001 — Typed entity model (Campaign, Scenario, Scene, NPC, PC, Clue, Item, Faction, Location, Session, Bond as first-class entity types)
- REQ-002 — Scene as hybrid nestable entity (own URL, lives under Scenario)

## Implementation Notes

Scene is a hybrid nestable entity — own URL, lives under Scenario.

## Dependencies

Blocked by #003.
