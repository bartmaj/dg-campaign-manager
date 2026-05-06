# v1 acceptance — live session run-through

The single criterion for v1 done: **the GM runs a full live Delta Green
session, of an imported published Arc Dream scenario, with this tool
as the only campaign-tracking surface, and doesn't fall back to
Obsidian / Notion / paper.**

Everything else in M1–M3 is preparation for this.

## Pre-flight

- [ ] Cross-browser smoke pass logged in `docs/cross-browser-smoke.md`.
- [ ] Disaster-recovery rehearsal logged in `docs/disaster-recovery.md`.
- [ ] Production deploy reachable; Vercel deployment protection toggled off (per REQ-N03 single-user URL-secrecy access model) OR you've decided to live with the SSO splash.
- [ ] A published Arc Dream scenario imported via `/import` and verified to round-trip.
- [ ] PCs created for every player; bonds and starting SAN populated.
- [ ] At least one Session row created for the upcoming session and **set as current** via the SessionDetailPage control.

## During the session

The GM is in **play mode** the entire time.

- [ ] Player sheets are accessed via Cmd-K or PC list — no second screen.
- [ ] Clues delivered via the play-mode toolbar (`D`) or the clue page; recipients selected; the clue's Delivery card and the session's Event log both update without a refresh.
- [ ] NPCs encountered via the toolbar (`E`); the NPC's encounter history and the session's Event log both update.
- [ ] SAN losses logged via the toolbar (`S`); breaking-point flashes fire when crossed.
- [ ] Bond damage logged via the toolbar (`B`); damage history per bond visible.
- [ ] Freeform session notes typed in real time into the Notes Card on the SessionDetailPage.

## Post-session

- [ ] The Event log on the session page tells a coherent story without me having to reorder anything.
- [ ] Player handout downloads cleanly and contains only player-safe content.
- [ ] No P0 (blocking) issues outstanding.
- [ ] P1 issues documented with workarounds in this file.

## Sign-off

Append the run-through entry below. v1 is done when **at least one**
entry is here with all checkboxes checked.

```
YYYY-MM-DD — Scenario: <name> — Players: <count> — Result: passed (or failed with notes)
```

## P1 issues + workarounds

(Append discovered issues + their workarounds here. None yet.)
