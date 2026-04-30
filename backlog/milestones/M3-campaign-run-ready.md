# M3 — Campaign-Run-Ready

**Status:** Not Started
**Target:** Weekend W6 (+ live-session run-through)
**Effort:** ~1.5 PWE

## Purpose

Make the tool usable at the table during a real campaign session — mode split, play-mode primary actions, auto-derived session reports, exports for handouts and archive, and the live-session run-through that gates v1.

## Deliverables

- 3A — Mode toggle + theming, play-mode primary actions toolbar, clue delivery flow, keyboard shortcuts
- 3B — Event tagging hooks, auto-derived session report UI, player handout exporter, campaign archive exporter
- 3C — Cross-browser pass, backup verification, live-session run-through, post-run-through bug fixes

## Dependencies

M1 (entities) + M2 (sessions, edges, exports, mechanics).

## Issues

- [ ] [#023 Implement distinct prep and play modes](../issues/023-implement-distinct-prep-and-play-modes.md)
- [ ] [#024 Implement the play-mode primary actions toolbar](../issues/024-implement-the-play-mode-primary-actions-toolbar.md)
- [ ] [#025 Implement the clue delivery flow](../issues/025-implement-the-clue-delivery-flow.md)
- [ ] [#026 Implement implicit event tagging during play mode](../issues/026-implement-implicit-event-tagging-during-play-mo.md)
- [ ] [#027 Render the auto-derived session report](../issues/027-render-the-auto-derived-session-report.md)
- [ ] [#028 Export player-safe Markdown handouts from a Session](../issues/028-export-player-safe-markdown-handouts-from-a-ses.md)
- [ ] [#029 Export the whole campaign as a Markdown archive](../issues/029-export-the-whole-campaign-as-a-markdown-archive.md)
- [ ] [#030 Verify daily Turso point-in-time recovery backup](../issues/030-verify-daily-turso-point-in-time-recovery-backu.md)
- [ ] [#031 Cross-browser pass on desktop browsers](../issues/031-cross-browser-pass-on-desktop-browsers.md)
- [ ] [#032 Run an end-to-end live session through the tool](../issues/032-run-an-end-to-end-live-session-through-the-tool.md)

## Definition of Done

Critical path: 3A → 3B → 3C. The live-session run-through is the v1 acceptance gate (PRD §6.2): a full live Delta Green session of an imported published Arc Dream scenario is run end-to-end through the tool — char sheets, clue lookups, NPC retrieval, SAN/Bond logging, and the session report — without falling back to Obsidian, Notion, or scattered notes. Post-session, all P0 issues surfaced are closed; P1 issues are documented with workarounds. Bug fixes from the run-through are absorbed in the same weekend window; if rework exceeds capacity, slip to W7 rather than ship without fixes.
