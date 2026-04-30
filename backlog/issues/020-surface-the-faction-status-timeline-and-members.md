---
id: 020
title: Surface the Faction status timeline and members
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [ui, domain]
req-ids: [REQ-025]
---

# Surface the Faction status timeline and members

## Narrative
**As** the Campaign Memory Keeper
**I want** a Faction page to show status timeline, member NPCs, and implicating clues
**So that** I track conspiracy state without re-reading prose

## Acceptance Criteria

```gherkin
Given a Faction with status notes, member NPCs, and implicating clues
When I view the Faction
Then the status timeline is shown in chronological order
And member NPCs are listed
And implicating clues are listed via reverse-ref
```

## REQ Traceability
- REQ-025 (full) — Faction entity (status timeline, member NPCs, implicating clues)

## Implementation Notes

Status timeline is an ordered notes child; members come from `npcs.faction_id`; clues from polymorphic relationships.

## Dependencies

Blocked by #018.
