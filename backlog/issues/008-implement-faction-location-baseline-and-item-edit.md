---
id: 008
title: Implement Faction, Location (baseline), and Item editors
milestone: M1
unit: M1 — Foundation
status: done
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

**Delivered**:
- `domain/faction.ts`, `domain/location.ts`, `domain/item.ts` — Zod input schemas only (no business logic).
- Schema additions (migration `drizzle/0004_chief_raza.sql`): `factions.agenda`, `items.history`. Locations needed no schema change.
- API endpoints in `api/factions/`, `api/locations/`, `api/items/` mirroring the PC/NPC pattern (GET list desc, POST create, GET by id).
- Frontend: typed wrappers in `src/api/`, hooks in `src/hooks/`, list/new/detail pages in `src/pages/{factions,locations,items}/` replacing `EntityStubPage` for these three.
- Item detail links `ownerNpcId` → `/npcs/:id` and `locationId` → `/locations/:id` as raw IDs (no related-entity fetch yet — that's M2.2A).
- Tests: 40 → 52 (+12). Three small domain tests per entity + one form smoke per entity.

**Open follow-ups**:
- M2.2A polymorphic-edge surfacing: faction member panel, location contents (NPCs/items at this location).
- #020 faction status timeline + member surfacing.
- #019 location reverse-ref panels (full surfacing of clues/NPCs/items/sessions tied to a location).
- Picker UX for `ownerNpcId` / `locationId` / `parentLocationId` — currently raw text inputs.
- No edit/delete flows yet.

## Dependencies

Blocked by #004, #006.
