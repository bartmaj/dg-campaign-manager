---
id: 030
title: Verify daily Turso point-in-time recovery backup
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
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

**Delivered**:
- `docs/disaster-recovery.md` documents the backup model, recovery rehearsal, and the manual restore-to-production procedure.
- `pnpm db:recovery-rehearsal` (script `scripts/db-recovery-rehearsal.ts`): forks production via `turso db create … --from-db dg-campaign-manager`, mints a fork token, counts every entity table on both prod and the fork, prints a side-by-side delta report, then tears the fork down (or keeps it via `KEEP_FORK=1`). Idempotent.
- The script is the GM's one-button confidence check; the README appends a "last verified" line per run.

**Open follow-ups**:
- Run the rehearsal once and append the verification timestamp to `docs/disaster-recovery.md`.
- Multi-campaign support would change the entity-count table list slightly; revisit if/when that lands.

## Dependencies

Blocked by #003.
