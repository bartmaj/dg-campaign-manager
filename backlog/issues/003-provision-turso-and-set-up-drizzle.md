---
id: 003
title: Provision Turso and set up Drizzle
milestone: M1
unit: M1 — Foundation
status: not-started
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

## Dependencies

Blocked by #001, #002.
