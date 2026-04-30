---
id: 017
title: Implement list views with filtering per entity type
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [ui, search]
req-ids: [REQ-014]
---

# Implement list views with filtering per entity type

## Narrative
**As** the Prepping GM
**I want** every entity list filterable by type-appropriate facets
**So that** I can narrow to "all NPCs in Faction X" or "all clues in Scenario Y" instantly

## Acceptance Criteria

```gherkin
Given the NPC list
When I filter by faction
Then only NPCs of that faction are shown
Given any entity list
When I apply type-appropriate filters (faction, status, location, scenario)
Then the visible records match the filter set
```

## REQ Traceability
- REQ-014 — List views with filtering (per entity type with type-appropriate facets)

## Implementation Notes

Server filters on indexed columns; TanStack Query caches per filter key.

## Dependencies

Blocked by #004, #008.
