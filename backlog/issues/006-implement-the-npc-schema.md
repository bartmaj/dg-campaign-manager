---
id: 006
title: Implement the NPC schema
milestone: M1
unit: M1 — Foundation
status: not-started
labels: [data-model, domain, ui]
req-ids: [REQ-005]
---

# Implement the NPC schema

## Narrative
**As** the GM at the Table
**I want** an NPC entity with stat block, RP hooks, faction reference, status, and relationships
**So that** I can pull a usable NPC up in seconds

## Acceptance Criteria

```gherkin
Given the NPC create form
When I enter an NPC with stat block (full or simplified), RP hooks (mannerisms, voice, secrets), faction ref, status (alive/dead/missing/turned), location, current goal
Then the NPC is persisted
And the four continuity dimensions (RP hooks, faction, relationship web, status) are visible on the detail page
```

## REQ Traceability
- REQ-005 — NPC entity (stat block, RP hooks, faction reference, status, location, current goal, relationships)

## Implementation Notes

Relationships to other NPCs surface in M2.2A reverse-ref work.

## Dependencies

Blocked by #004.
