---
id: 011
title: Implement Bonds as a first-class entity with damage history
milestone: M2
unit: M2 — Core Workbench
status: not-started
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

## Dependencies

Blocked by #005, #006.
