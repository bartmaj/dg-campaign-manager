---
id: 004
title: Define the typed entity model
milestone: M1
unit: M1 — Foundation
status: done
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

**Delivered**:
- 11 entity tables in `db/schema.ts`: campaigns, scenarios, scenes, pcs, npcs, clues, items, factions, locations, sessions, bonds. Minimal columns — full DG-RAW PC/NPC fields land in #005/#006.
- Polymorphic `edges` table per ADR-002: `(source_type, source_id, target_type, target_id, kind, notes, created_at)` with indexes on source, target, and kind.
- Spike test (`db/edges.test.ts`) validates clue→scene linkage and reverse-ref lookup. ADR-002 polymorphic-edge approach confirmed; M2 unblocked.
- TypeScript types exported per entity (`Campaign`/`NewCampaign`, etc.) via Drizzle `$inferSelect`/`$inferInsert`.
- Migration `drizzle/0001_third_thundra.sql` applied to local libSQL and Turso production.
- React Router 7 wired in `src/router.tsx`. Routes per entity: `/list`, `/list/new`, `/list/:id`. Layout with top-nav in `src/components/Layout.tsx`. Generic `EntityStubPage` component renders list/new/detail placeholders pointing to the future issue (e.g. PCs → #005). HomePage shows the entity index.
- Vite scaffold's default `App.tsx`/`App.css` removed; all UI now flows through the router.

## Dependencies

Blocked by #003.
