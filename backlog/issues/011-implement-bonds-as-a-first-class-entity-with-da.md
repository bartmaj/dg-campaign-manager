---
id: 011
title: Implement Bonds as a first-class entity with damage history
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [data-model, domain, ui]
req-ids: [REQ-006]
---

# Implement Bonds as a first-class entity with damage history

## Narrative
**As** the Campaign Memory Keeper
**I want** Bonds tracked numerically with damage history
**So that** I see exactly when and why a Bond degraded

## Acceptance Criteria

```gherkin
Given a PC with a Bond to NPC X at value 12
When I apply 3 Bond damage with a reason and session reference
Then the Bond's current value is 9
And a damage event is logged with timestamp, reason, and session link
And the change is reflected on both the PC and the Bond target
```

## REQ Traceability
- REQ-006 — Bonds as structured entity (source PC, target, label, current/max value, damage events log)

## Implementation Notes

Bond mutation logic lives in `Domain.bonds.applyDamage()` — pure TS, unit-tested.

**Delivered**:
- Migration `drizzle/0006_sticky_menace.sql` (additive only): adds `max_score`, `target_type`, `target_id`, `description` to `bonds`, and a new `bond_damage_events` table. The pre-existing `score` column stays — exposed in TS as `currentScore` rather than a destructive rename.
- `domain/bonds.ts`: `applyDamage(currentScore, delta, opts)` with floor/ceiling clamps; `summarizeHistory(events)`; Zod schemas for create + damage payloads.
- API: `api/bonds/index.ts` (GET filtered by `pcId` OR `targetType + targetId`, POST), `api/bonds/[id].ts` (GET returns `{ bond, events }`, DELETE), `api/bonds/[id]/damage.ts` (POST in a libSQL transaction — event row insert + bond `currentScore` update atomic).
- Frontend: `src/api/bonds.ts`, `src/hooks/useBonds.ts` (`useBondsForPc`, `useIncomingBonds`, `useBond`), `useCreateBond` / `useApplyBondDamage` / `useDeleteBond` mutations.
- `PcDetailPage` rewritten with full Bonds section: list, "Add Bond" form, per-bond damage/repair (single magnitude input + two buttons), inline last-3 history with expand toggle, "Bonds with this character" incoming-bond section for PC↔PC.
- `NpcDetailPage` gains the matching incoming-bonds section.
- Tests: 78 → 97 (+19). 14 in `domain/bonds.test.ts`, 4 in `PcDetailPage.test.tsx`.

**Open follow-ups**:
- Typed entity picker for `targetId` and `sessionId`.
- N+1 query: `useBond` runs per-row inside the bonds list (acceptable for typical PC bond counts; revisit if PCs accumulate many bonds).
- Cleanup migration to rename `bonds.score` → `bonds.current_score` once we're sure no external consumers reference it.
- Sanity tracking is its own issue (#012).

## Dependencies

Blocked by #005, #006.
