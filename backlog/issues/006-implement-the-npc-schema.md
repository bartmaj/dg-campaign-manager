---
id: 006
title: Implement the NPC schema
milestone: M1
unit: M1 — Foundation
status: done
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

**Delivered**:
- `domain/npc.ts` — `NPC_STATUSES`, `NpcStatus`, Zod discriminated-union stat block (`simplified` { hp, wp } vs `full` { stats }), `npcInputSchema`. Reuses `pcStatsSchema` for full-stat range validation.
- `npcs` table extended (migration `drizzle/0003_special_marten_broadcloak.sql`): profession, six nullable stats, hp/wp, mannerisms, voice, secrets, status (NOT NULL default `alive`), locationId, currentGoal.
- API: `api/npcs/index.ts` (GET list ordered by `updatedAt` desc, POST with deriveAttributes for full stats) + `api/npcs/[id].ts` (GET by id).
- Frontend: `src/api/npcs.ts`, `src/hooks/useNpcs.ts`, `src/hooks/useCreateNpc.ts`, list/new/detail pages. Detail page surfaces all four continuity dimensions: RP hooks, faction (raw id), relationships (M2.2A placeholder), status (colored chip).
- Tests: 15 → 27 (+12). Domain coverage of status enum, simplified/full block parsing, range delegation, input validation; smoke test for the create form.

**Open follow-ups**:
- Faction/Location dropdowns land in #008.
- Relationship UI lands with M2.2A polymorphic-edge surfacing.
- Update/delete endpoints (and analogous edit forms) deferred until edit flows are needed.

## Dependencies

Blocked by #004.
