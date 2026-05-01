---
id: 003
title: Provision Turso and set up Drizzle
milestone: M1
unit: M1 — Foundation
status: done
labels: [data-model, ops, scaffold]
req-ids: [REQ-N10, INT-001]
---

# Provision Turso and set up Drizzle

## Narrative
**As** the Prepping GM
**I want** a Turso libSQL DB with Drizzle ORM and migration tooling configured
**So that** schema changes are reproducible and version-controlled

## Acceptance Criteria

```gherkin
Given a fresh Turso DB and a Drizzle config
When I run `drizzle-kit generate` then `drizzle-kit migrate`
Then the schema is applied to the DB
And the migration file is checked into the repo
And `pnpm db:status` reports a healthy connection
And a seed script populates representative dev fixtures
```

## REQ Traceability
- REQ-N10 — Drizzle migrations (all schema changes go through Drizzle migrations checked into the repo)
- INT-001 — Turso (libSQL) integration

## Implementation Notes

Includes the polymorphic-edge schema spike per milestones R-3 — if Drizzle reverse-ref ergonomics fail, fall back to per-pair junction tables before M2 starts.

**Delivered**:
- Turso DB `dg-campaign-manager` provisioned in `aws-us-east-1` group `default`
- Drizzle ORM (`drizzle-orm@0.45`, `drizzle-kit@0.31`) + `@libsql/client` configured
- Schema scaffold at `db/schema.ts` (only `_meta` table for now — entity tables land in #004)
- First migration `drizzle/0000_nervous_frog_thor.sql` applied to Turso successfully
- pnpm scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:status`, `db:seed`
- Seed script at `scripts/seed.ts`; status script at `scripts/db-status.ts`
- Server-only TS project (`tsconfig.server.json`) covering `db/`, `scripts/`, `drizzle.config.ts` so node-typed code stays out of the browser bundle
- Vercel production env: `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` set
- `.env.example` checked in; `.env`, `*.db` gitignored

**Polymorphic-edge spike**: deferred to #004 where actual entity tables exist to test against. The `_meta` table here only validates the migration pipeline.

**Open follow-up**: Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to Vercel **Preview** environment via the dashboard (the CLI flow was blocked by a plugin guard requiring branch-level interactive confirmation).

## Dependencies

Blocked by #001, #002.
