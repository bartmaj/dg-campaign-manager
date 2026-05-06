---
id: 026
title: Implement implicit event tagging during play mode
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
labels: [domain]
req-ids: [REQ-011]
---

# Implement implicit event tagging during play mode

## Narrative
**As** the GM at the Table
**I want** play-mode mutations to auto-stamp the active Session
**So that** session reports build themselves while I run the game

## Acceptance Criteria

```gherkin
Given play mode with an active Session set
When I mark a clue delivered, encounter an NPC, apply SAN loss, or apply Bond damage
Then an event-tag row is appended for the active Session
And the action requires no extra clicks beyond the mutation itself
```

## REQ Traceability
- REQ-011 (substrate) — Auto-derived session report substrate (session-scoped mutations stamp the active Session id)

## Implementation Notes

Active Session id lives in app-shell state; auto-stamped on every relevant API call.

**Delivered**:
- Migration `drizzle/0011_chief_selene.sql` adds `npc_encounter_events` (npcId FK cascade, sessionId FK cascade, optional note, appliedAt).
- `domain/npcEncounter.ts` + Zod schema.
- New routes (66 → 69): `POST /npcs/:id/encounter`, `GET /npcs/:id/encounters`, `GET /sessions/:id/encountered-npcs`. Existing `sessionsList?involves` UNION extended to include encounter events.
- `useStampSessionId` wrapper: when in play mode + currentSession set, mutations missing `sessionId` get it injected; explicit caller value always wins; no inject in prep mode or without active session. Applied to `useApplyBondDamage`, `useApplySanityChange`, `useCreateClueDeliveryEvent`, `useCreateNpcEncounter`.
- PlayActionsToolbar gets a 6th button "Encounter NPC" (hotkey `E`); ShortcutsOverlay updated.
- NpcDetailPage gets an Encounter history Card; SessionDetailPage gets an NPCs encountered Card alongside Delivered clues.
- Tests: 291 → 301 (+10): 2 domain, 7 stamping coverage across 4 hooks, 1 toolbar.

**Open follow-ups**:
- The substrate is in place for #027 (auto-derived session report) — encounters, deliveries, SAN events, and bond damage events all carry `sessionId` in play mode automatically.

## Dependencies

Blocked by #023, #025, #011, #012.
