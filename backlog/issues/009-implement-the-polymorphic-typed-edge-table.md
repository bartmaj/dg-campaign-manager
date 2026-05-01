---
id: 009
title: Implement the polymorphic typed-edge table
milestone: M2
unit: M2 — Core Workbench
status: done
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

**Delivered**:
- Schema already in place from #004.
- `domain/edges.ts`: `EDGE_RULES` allowlist (15 canonical triples spanning clue/npc/pc/item/faction/session source-target combinations), `EdgeKind` union, helpers (`isValidEdge`, `getEdgeRule`, `kindsForSource`), `edgeInputSchema` with Zod `.refine()` enforcing the allowlist.
- API: `api/edges/index.ts` (POST validates via schema with 400 on failure; GET filters by any combination of sourceType/sourceId/targetType/targetId/kind, returns `[]` if no filters), `api/edges/[id].ts` (GET, DELETE).
- Frontend: `src/api/edges.ts` typed wrappers, `src/hooks/useEdges.ts` (`edgeKeys`, `useEdges`, `useEdge`, `useIncomingEdges`, `useOutgoingEdges`), `useCreateEdge`, `useDeleteEdge` mutations.
- First reverse-ref demonstration: `FactionDetailPage` shows an "Implicating clues" section using `useIncomingEdges('faction', factionId)` filtered to `sourceType === 'clue' && kind === 'implicates'`. Empty state renders an em-dash; populated state lists each clue with a link to `/clues/:sourceId`.
- Tests: 52 → 70 (+18). Domain coverage of allowlist (canonical, wrong-type rejection, unknown-kind rejection), `kindsForSource`, Zod schema validation. UI test seeds the QueryClient cache directly to assert populated/empty/filter behavior on `FactionDetailPage`.

**Open follow-ups (mostly for #018)**:
- Edge-creation/edit/delete UI on entity pages.
- Hydrating linked-entity display names (currently raw IDs in the section).
- Equivalent reverse-ref sections on other detail pages: NpcDetailPage "Mentioned by clues", LocationDetailPage "Occupants", etc.
- Edge delivery state for clues (`delivered_in`) — proper mechanics in #025.

## Dependencies

Blocked by #004, #008.
