---
id: 020
title: Surface the Faction status timeline and members
milestone: M2
unit: M2 — Core Workbench
status: done
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

**Delivered**:
- Migration `drizzle/0009_moaning_supernaut.sql` adds `faction_status_events` (factionId FK cascade-delete, note, occurredAt, optional sessionId, createdAt). Applied to local + Turso.
- `domain/factionStatus.ts` — Zod input schema + `compareByOccurredAt` (with `createdAt` tiebreaker).
- New routes (51 → 54): `GET /factions/:id/status`, `POST /factions/:id/status`, `DELETE /faction-status-events/:id` (separate top-level path because the router supports a single positional id).
- Frontend: `src/api/factionStatus.ts`, `src/hooks/useFactionStatus.ts` (list + create + delete; per-faction list invalidation).
- `FactionContext` (3 cards: Status timeline, Members, Implicating clues) mirrors `LocationContext`. Status timeline has an inline add-note form. Members union FK source (NPCs by `factionId`) with edge source (`npc→faction 'member_of'`), FK wins on dedupe. Replaces the page's previous curated cards.
- Tests: 235 → 244 (+9). 4 domain tests, 5 component tests covering empty states, sort order, FK-vs-edge dedupe, implicating-clues filter, add-status-note form smoke.

**Open follow-ups**:
- Inline form vs full RHF + Zod resolver — current matches `LocationContext` for consistency; promote to RHF if richer affordances arrive.
- Status notes aren't in the search index; create/delete still invalidate `searchIndexQueryKey` defensively per the #016 convention. Full-text over status text would need a `domain/searchMatch.ts` aggregator.

## Dependencies

Blocked by #018.
