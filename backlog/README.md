# Backlog

This is a local, file-based backlog for the Delta Green Campaign Manager project — no GitHub Issues, no project board. Stories live as Markdown files with YAML front-matter; status is tracked by editing the front-matter `status:` field on each issue.

The backlog mirrors Appendix A of `docs/architecture.md` (work breakdown), Appendix C (REQ traceability), and Appendix D (staffing). When the architecture document changes, regenerate this backlog.

## Convention

- **Issues** live in `issues/NNN-slug.md`. Numbering is stable and follows build order (M1 first, then M2, then M3, in the order of Appendix A).
- **Milestones** live in `milestones/M{n}-{name}.md` and link out to their issues with checkbox lists.
- **Labels** are listed in `labels.md` and applied via the front-matter `labels:` array on each issue.
- **REQ traceability** is the front-matter `req-ids:` array, plus an explicit REQ Traceability section in the body.

## Status legend

| Status | Meaning |
|---|---|
| `not-started` | Work has not begun |
| `in-progress` | Active development |
| `blocked` | Waiting on another issue or external dependency |
| `done` | Acceptance criteria met, merged, and verified |

Update an issue's front-matter `status:` field to track progress. Update the milestone file's checkbox to `[x]` when an issue moves to `done`.

## Milestones

| Milestone | Title | Stories | Target | Effort |
|---|---|---|---|---|
| [M1](milestones/M1-foundation.md) | Foundation | 8 | W1–W2 | ~2.0 PWE |
| [M2](milestones/M2-core-workbench.md) | Core Workbench | 14 | W3–W5 | ~2.5 PWE |
| [M3](milestones/M3-campaign-run-ready.md) | Campaign-Run-Ready | 10 | W6 | ~1.5 PWE |
| **Total** | — | **32** | 6 weekends | **~6.0 PWE** |

## All issues

| ID | Title | Milestone | Status | REQ-IDs |
|---|---|---|---|---|
| [001](issues/001-bootstrap-the-project-scaffold.md) | Bootstrap the project scaffold | M1 | not-started | REQ-N08, REQ-N09, REQ-N11 |
| [002](issues/002-wire-vercel-deploy-pipeline.md) | Wire Vercel deploy pipeline | M1 | not-started | REQ-N12, REQ-N03, INT-002 |
| [003](issues/003-provision-turso-and-set-up-drizzle.md) | Provision Turso and set up Drizzle | M1 | not-started | REQ-N10, INT-001 |
| [004](issues/004-define-the-typed-entity-model.md) | Define the typed entity model | M1 | not-started | REQ-001, REQ-002 |
| [005](issues/005-implement-the-dg-raw-pc-schema.md) | Implement the DG RAW PC schema | M1 | not-started | REQ-004 |
| [006](issues/006-implement-the-npc-schema.md) | Implement the NPC schema | M1 | not-started | REQ-005 |
| [007](issues/007-build-the-shared-character-form-with-skill-pack.md) | Build the shared character form with skill-package presets | M1 | not-started | REQ-008 |
| [008](issues/008-implement-faction-location-baseline-and-item-edit.md) | Implement Faction, Location (baseline), and Item editors | M1 | not-started | REQ-024, REQ-025, REQ-026 |
| [009](issues/009-implement-the-polymorphic-typed-edge-table.md) | Implement the polymorphic typed-edge table | M2 | not-started | REQ-003, REQ-015 |
| [010](issues/010-implement-the-clue-entity-with-provenance-and-ed.md) | Implement the Clue entity with provenance and edges | M2 | not-started | REQ-009, REQ-003 |
| [011](issues/011-implement-bonds-as-a-first-class-entity-with-da.md) | Implement Bonds as a first-class entity with damage history | M2 | not-started | REQ-006 |
| [012](issues/012-implement-sanity-tracking-with-breaking-point-d.md) | Implement Sanity tracking with breaking-point detection | M2 | not-started | REQ-007 |
| [013](issues/013-implement-sessions-with-hybrid-in-game-real-wor.md) | Implement Sessions with hybrid in-game / real-world timeline | M2 | not-started | REQ-010 |
| [014](issues/014-implement-bulk-markdown-scenario-import.md) | Implement bulk Markdown scenario import | M2 | not-started | REQ-016 |
| [015](issues/015-implement-per-entity-markdown-export.md) | Implement per-entity Markdown export | M2 | not-started | REQ-017, REQ-N04 |
| [016](issues/016-implement-the-cmd-k-global-search-palette.md) | Implement the Cmd-K global search palette | M2 | not-started | REQ-013, REQ-N01 |
| [017](issues/017-implement-list-views-with-filtering-per-entity-.md) | Implement list views with filtering per entity type | M2 | not-started | REQ-014 |
| [018](issues/018-surface-relationships-and-recent-activity-on-en.md) | Surface relationships and recent activity on entity detail pages | M2 | not-started | REQ-015 |
| [019](issues/019-surface-local-context-on-the-location-detail-pa.md) | Surface local context on the Location detail page | M2 | not-started | REQ-024 |
| [020](issues/020-surface-the-faction-status-timeline-and-members.md) | Surface the Faction status timeline and members | M2 | not-started | REQ-025 |
| [021](issues/021-hit-page-navigation-latency-target.md) | Hit page navigation latency target | M2 | not-started | REQ-N02 |
| [022](issues/022-cover-critical-domain-logic-with-unit-tests.md) | Cover critical domain logic with unit tests | M2 | not-started | REQ-N09 |
| [023](issues/023-implement-distinct-prep-and-play-modes.md) | Implement distinct prep and play modes | M3 | not-started | REQ-019 |
| [024](issues/024-implement-the-play-mode-primary-actions-toolbar.md) | Implement the play-mode primary actions toolbar | M3 | not-started | REQ-020, REQ-N07 |
| [025](issues/025-implement-the-clue-delivery-flow.md) | Implement the clue delivery flow | M3 | not-started | REQ-009 |
| [026](issues/026-implement-implicit-event-tagging-during-play-mo.md) | Implement implicit event tagging during play mode | M3 | not-started | REQ-011 |
| [027](issues/027-render-the-auto-derived-session-report.md) | Render the auto-derived session report | M3 | not-started | REQ-011 |
| [028](issues/028-export-player-safe-markdown-handouts-from-a-ses.md) | Export player-safe Markdown handouts from a Session | M3 | not-started | REQ-012 |
| [029](issues/029-export-the-whole-campaign-as-a-markdown-archive.md) | Export the whole campaign as a Markdown archive | M3 | not-started | REQ-018 |
| [030](issues/030-verify-daily-turso-point-in-time-recovery-backu.md) | Verify daily Turso point-in-time recovery backup | M3 | not-started | REQ-N05 |
| [031](issues/031-cross-browser-pass-on-desktop-browsers.md) | Cross-browser pass on desktop browsers | M3 | not-started | REQ-N06 |
| [032](issues/032-run-an-end-to-end-live-session-through-the-tool.md) | Run an end-to-end live session through the tool | M3 | not-started | §6.2 |

> This is a local, file-based backlog — no GitHub Issues. Update front-matter `status:` to track progress.
