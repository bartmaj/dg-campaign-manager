---
id: 030
title: Verify daily Turso point-in-time recovery backup
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
labels: [ops]
req-ids: [REQ-N05]
---

# Verify daily Turso point-in-time recovery backup

## Narrative
**As** the Campaign Memory Keeper
**I want** Turso PITR verified at least once
**So that** disaster recovery is a known-working path, not a hope

## Acceptance Criteria

```gherkin
Given the production Turso DB with daily PITR enabled
When I trigger a recovery rehearsal
Then the most recent PITR snapshot restores successfully to a recovery target
And the recovery procedure is documented in the README
```

## REQ Traceability
- REQ-N05 — DB backup (daily Turso PITR; verified at least once during initial setup)

## Implementation Notes

One-time verification at setup; revisit only on Turso platform changes.

## Dependencies

Blocked by #003.
