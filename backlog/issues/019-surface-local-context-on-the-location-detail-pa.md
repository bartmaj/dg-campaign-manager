---
id: 019
title: Surface local context on the Location detail page
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [ui, domain]
req-ids: [REQ-024]
---

# Surface local context on the Location detail page

## Narrative
**As** the GM at the Table
**I want** a Location page to show every clue, NPC, item, and prior session event tied to that location
**So that** I have a single read-out when players arrive somewhere

## Acceptance Criteria

```gherkin
Given a Location with linked clues, present NPCs, items at the location, and prior session events
When I open the Location at the table
Then all four panels (clues, NPCs, items, session events) are visible
And no navigation is required to see any of them
```

## REQ Traceability
- REQ-024 (full) — Location entity surfaces local context (linked clues, present NPCs, items at the location, prior session events)

## Implementation Notes

Joins relationships + session-tag rows; same pattern as REQ-015.

**Delivered**:
- `src/components/LocationContext/LocationContext.tsx` — four curated panels (Linked clues, Present NPCs, Items at this location, Sessions at this location), each its own `Card`. Composes only design-system primitives.
- Linked clues: incoming edges filtered to `clue→location 'points_to'`, names resolved via `useEntityNames`.
- Present NPCs: union of `useNpcs({ locationId })` (FK source — wins on dedupe) and incoming edges with `kind in ('occupies', 'frequents')`. Each row carries a `Badge` indicating the linkage type.
- Items at this location: `useItems({ locationId })`, with optional owner-NPC name enrichment.
- Sessions at this location: reuses `useSessionsInvolving('location', id)`.
- `LocationDetailPage` drops the page-level `EntityRecentActivity` (replaced by the new sessions panel) but keeps `EntityRelationships` for the full graph view.
- No new endpoints. Pages compose primitives only.
- Tests: 230 → 235 (+5).

**Open follow-ups**:
- #020 will add the analogous `FactionContext` (members + items + sessions). If a third caller needs the same shape, generalize the panel sub-components into a shared `RelatedEntitiesPanel` primitive.
- A small `<SessionList>` primitive could be extracted between `EntityRecentActivity` and `LocationContext`'s sessions panel — defer until a third caller appears.

## Dependencies

Blocked by #018.
