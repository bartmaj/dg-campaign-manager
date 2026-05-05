---
id: 018
title: Surface relationships and recent activity on entity detail pages
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [ui, domain]
req-ids: [REQ-015]
---

# Surface relationships and recent activity on entity detail pages

## Narrative
**As** the Campaign Memory Keeper
**I want** every entity detail page to surface incoming and outgoing relationships and recent session activity
**So that** I see the full context of any entity at a glance

## Acceptance Criteria

```gherkin
Given an NPC referenced by 3 clues and present in 2 sessions
When I open the NPC detail page
Then the 3 clues are listed under "Referenced by"
And the 2 sessions are listed under "Recent activity"
And no manual navigation is required to see them
```

## REQ Traceability
- REQ-015 — Entity detail surfaces relationships (incoming/outgoing typed relationships + recent session activity)

## Implementation Notes

Implemented via the reverse-ref API + session-tag join.

**Delivered**:
- `EntityRelationships` and `EntityRecentActivity` shared components composing primitives — no inline styles.
- New endpoint `GET /search/names?type=…&ids=…` returns `{ id, name }[]` for batch resolution; `useEntityNames(type, ids)` hook caches per `(type, sortedIds)`.
- `sessionsList` extended with `?involvesType=&involvesId=`. Server-side union spans (a) edges where one endpoint is the session and the other is `(:type, :id)`, (b) `bond_damage_events` joined to bonds where `pcId` or `targetId` matches (PC/NPC only), (c) `san_change_events` for the PC. Documented inline.
- Wired into all 9 detail pages. SessionDetailPage skips RecentActivity (tautological).
- Tests: 223 → 230 (+7).
- Catch-all router: 50 → 51 routes.

**Open follow-ups**:
- Duplicate authoring + display UI on Clue/Faction/Session detail pages — extract a shared edge-editor + collapse the curated cards into the generic Relationships card.
- Session edges aren't auto-created yet for non-PC/NPC entities; REQ-011 / #026 (event tagging) closes this once a session is tagged.
- Server-side test coverage for the involves filter once an API test harness exists.

## Dependencies

Blocked by #009, #013.
