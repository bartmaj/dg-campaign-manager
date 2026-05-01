# M2 — Core Workbench

**Status:** In Progress (4/14 done)
**Target:** Weekends W3–W5
**Effort:** ~2.5 PWE

## Purpose

Make the tool useful for prep work — investigation graph, DG mechanics (Bonds + Sanity), sessions, bulk import, exports, and Cmd-K retrieval.

## Deliverables

- 2A — Relationships table & API, Clue entity, reverse-ref surfacing, edge domain tests
- 2B — Bond entity & UI, SAN block & UI, mechanic unit tests
- 2C — Session entity, in-game + real-session timeline views
- 2D — MD scenario template spec, bulk MD importer, per-entity MD export, Cmd-K palette, list views with filters

## Dependencies

M1 (entity schemas, Drizzle plumbing, character form).

## Issues

- [x] [#009 Implement the polymorphic typed-edge table](../issues/009-implement-the-polymorphic-typed-edge-table.md)
- [x] [#010 Implement the Clue entity with provenance and edges](../issues/010-implement-the-clue-entity-with-provenance-and-ed.md)
- [x] [#011 Implement Bonds as a first-class entity with damage history](../issues/011-implement-bonds-as-a-first-class-entity-with-da.md)
- [x] [#012 Implement Sanity tracking with breaking-point detection](../issues/012-implement-sanity-tracking-with-breaking-point-d.md)
- [ ] [#013 Implement Sessions with hybrid in-game / real-world timeline](../issues/013-implement-sessions-with-hybrid-in-game-real-wor.md)
- [ ] [#014 Implement bulk Markdown scenario import](../issues/014-implement-bulk-markdown-scenario-import.md)
- [ ] [#015 Implement per-entity Markdown export](../issues/015-implement-per-entity-markdown-export.md)
- [ ] [#016 Implement the Cmd-K global search palette](../issues/016-implement-the-cmd-k-global-search-palette.md)
- [ ] [#017 Implement list views with filtering per entity type](../issues/017-implement-list-views-with-filtering-per-entity-.md)
- [ ] [#018 Surface relationships and recent activity on entity detail pages](../issues/018-surface-relationships-and-recent-activity-on-en.md)
- [ ] [#019 Surface local context on the Location detail page](../issues/019-surface-local-context-on-the-location-detail-pa.md)
- [ ] [#020 Surface the Faction status timeline and members](../issues/020-surface-the-faction-status-timeline-and-members.md)
- [ ] [#021 Hit page navigation latency target](../issues/021-hit-page-navigation-latency-target.md)
- [ ] [#022 Cover critical domain logic with unit tests](../issues/022-cover-critical-domain-logic-with-unit-tests.md)

## Definition of Done

Critical path: 2A → 2D (import depends on edges); 2B and 2C run in parallel within the same weekend allocations. The MD scenario template — the single biggest design risk in v1 — is validated by ingesting at least one real published Arc Dream scenario end-to-end. Cmd-K hits the <1s budget on a 1,000-entity dataset; entity navigation hits <500ms. Domain unit tests (char-gen, SAN, Bond, clue-delivery, MD import) pass in CI. M2 DoD is the cut line for scope creep — defer Could-Haves rather than extend.
