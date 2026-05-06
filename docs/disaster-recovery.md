# Disaster recovery — Turso PITR

Single-source guide for restoring `dg-campaign-manager` from a Turso
point-in-time-recovery snapshot. Verified once during M3 setup
(see `pnpm db:recovery-rehearsal`); revisit only when Turso platform
behavior changes.

## Backup model

- **Provider**: Turso (libSQL hosted).
- **Cadence**: continuous WAL replication — point-in-time recovery
  available within the retention window of the project's plan
  (free tier: 24 hours; paid tiers extend it).
- **Authoritative DB**: `dg-campaign-manager` in group `default`,
  region `aws-us-east-1`. Connection lives at
  `TURSO_DATABASE_URL` in Vercel production env.

## Recovery rehearsal — what we verify

The rehearsal restores the latest snapshot into a **fork** database
named `dg-campaign-manager-recovery-rehearsal`. The fork is a
side-by-side copy; the production DB is never touched. After the
fork lands we count rows on every entity table and compare against
production. A non-empty fork that matches the production counts
within a small delta (≤ N rows added in the gap between snapshot and
prod read) means PITR is healthy.

The rehearsal is idempotent — it deletes the fork at the end, or you
can leave it for further inspection by setting `KEEP_FORK=1`.

## Run the rehearsal

```bash
turso auth login
pnpm db:recovery-rehearsal
```

The script performs:

1. `turso db create dg-campaign-manager-recovery-rehearsal --from-db dg-campaign-manager` — Turso forks the source DB at the latest committed point.
2. Mints a fork token via `turso db tokens create`.
3. Connects to the fork with libSQL and queries
   `SELECT COUNT(*) FROM <each entity table>`.
4. Connects to production and queries the same counts.
5. Prints a side-by-side report. The fork is destroyed on exit unless
   `KEEP_FORK=1`.

## Manual restore to production (real disaster)

If production is corrupted and we need to roll back:

1. **Stop traffic**: pause writes by toggling deployment protection on
   Vercel or temporarily yanking `TURSO_DATABASE_URL` from the
   project's env (forces 500s — preferable to a corrupt write loop).
2. `turso db create dg-campaign-manager-restored --from-db dg-campaign-manager --timestamp <ISO-8601>` — fork at the desired prior point. Pick a timestamp before the corruption.
3. Verify the fork via `turso db shell dg-campaign-manager-restored` and a few sanity queries. Confirm the entity counts look right.
4. **Promote the fork**: there is no in-place "rewind" today — instead, change Vercel's `TURSO_DATABASE_URL` to point at the restored fork, redeploy. The original DB stays untouched as forensic evidence.
5. After things stabilize, optionally rename:
   - Rename the corrupted DB: `turso db rename dg-campaign-manager dg-campaign-manager-corrupted-<date>`.
   - Rename the restored fork: `turso db rename dg-campaign-manager-restored dg-campaign-manager`.
   - Update Vercel env back to the original URL.

## Recovery time objective

For this project (single GM, weekend cadence) the budget is generous —
RTO ≤ 1 hour is comfortable. The rehearsal completes in < 2 minutes
on the free tier.

## Recovery point objective

Bounded by Turso's PITR window. Free tier = 24 hours. Anything
written after the chosen restore timestamp is lost; the GM
re-enters those events manually. Per-entity Markdown export
(#015) and the campaign archive (#029) are independent backup
paths — keep a recent ZIP committed to a git mirror as belt-and-
suspenders.

## Last verified

Run the rehearsal and append here:

```
YYYY-MM-DD — pnpm db:recovery-rehearsal — restored at <snapshot ts>, counts matched
```
