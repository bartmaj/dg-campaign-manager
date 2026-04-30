---
id: 008
title: Implement Faction, Location (baseline), and Item editors
milestone: M1
unit: M1 — Foundation
status: not-started
labels: [data-model, ui]
req-ids: [REQ-024, REQ-025, REQ-026]
---

# Implement Faction, Location (baseline), and Item editors

## Narrative
**As** the Prepping GM
**I want** Faction, Location, and Item entities creatable, editable, and viewable
**So that** I can populate a published-scenario world without import

## Acceptance Criteria

```gherkin
Given a fresh campaign
When I create a Faction with name, agenda, and member NPC refs
Then the Faction is persisted with its baseline fields
When I create a Location with name and description
Then the Location is persisted (link surfacing deferred to M2.2A)
When I create an Item with name, description, current location, and owner refs
Then the Item is persisted with its baseline fields
```

## REQ Traceability
- REQ-024 (baseline) — Location entity surfaces local context (full surfacing deferred to #019)
- REQ-025 (baseline) — Faction entity (full status timeline + members surfacing deferred to #020)
- REQ-026 — Item entity (name, description, current location, owner refs, history)

## Implementation Notes

Full Faction status timeline + member surfacing and full Location reverse-ref panels arrive in M2.2A.

## Dependencies

Blocked by #004, #006.
