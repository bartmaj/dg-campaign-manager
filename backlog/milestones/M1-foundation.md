# M1 — Foundation

**Status:** In Progress (5/8 done)
**Target:** Weekends W1–W2
**Effort:** ~2.0 PWE

## Purpose

Establish the project skeleton, deployment pipeline, schema infrastructure, and the baseline typed-entity CRUD layer that all later units depend on.

## Deliverables

- 1A — Repo scaffolding, dev tooling, CI pipeline, Vercel deploy pipeline
- 1B — Turso provisioning, Drizzle setup, initial schema migration, seed/fixture script
- 1C — Entity routing & layout, generic CRUD components, PC schema, NPC schema, skill-package presets, Faction/Location/Item editors

## Dependencies

None (foundational unit).

## Issues

- [x] [#001 Bootstrap the project scaffold](../issues/001-bootstrap-the-project-scaffold.md)
- [x] [#002 Wire Vercel deploy pipeline](../issues/002-wire-vercel-deploy-pipeline.md)
- [x] [#003 Provision Turso and set up Drizzle](../issues/003-provision-turso-and-set-up-drizzle.md)
- [x] [#004 Define the typed entity model](../issues/004-define-the-typed-entity-model.md)
- [x] [#005 Implement the DG RAW PC schema](../issues/005-implement-the-dg-raw-pc-schema.md)
- [ ] [#006 Implement the NPC schema](../issues/006-implement-the-npc-schema.md)
- [ ] [#007 Build the shared character form with skill-package presets](../issues/007-build-the-shared-character-form-with-skill-pack.md)
- [ ] [#008 Implement Faction, Location (baseline), and Item editors](../issues/008-implement-faction-location-baseline-and-item-edit.md)

## Definition of Done

Critical path 1A → 1B → 1C complete (strictly serial). All 8 stories merged with passing CI. Polymorphic-edge schema spike resolved in 1B — if the spike fails, fall back to per-pair junction tables before W3 begins. Live preview deploys reachable; production URL serves a working app skeleton; baseline entities (PC, NPC, Faction, Location, Item) have working create/list/detail pages.
