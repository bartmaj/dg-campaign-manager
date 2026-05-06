---
id: 028
title: Export player-safe Markdown handouts from a Session
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
labels: [import-export, domain]
req-ids: [REQ-012]
---

# Export player-safe Markdown handouts from a Session

## Narrative
**As** the GM at the Table
**I want** a player-safe Markdown handout from any Session
**So that** I can share recap content with players without leaking GM-only notes

## Acceptance Criteria

```gherkin
Given a Session with mixed GM-only and player-safe notes
When I export a handout
Then only player-safe content is included (delivered clues, named NPCs, locations visited, GM-flagged player-safe notes)
And GM-only fields and unflagged content are excluded
```

## REQ Traceability
- REQ-012 — Player handout export from session (player-safe Markdown only)

## Implementation Notes

Filter rules live in `Domain.mdExport.handout`.

**Delivered**:
- Migration `drizzle/0013_brainy_rafael_vega.sql` adds `sessions.player_notes` (separate from GM-only `notes`).
- `domain/mdExport.ts` gains `serializeSessionHandout(input)` — pure deterministic serializer over a redacted shape: session header, "What you learned" (delivered clue names + descriptions), "People encountered" (NPC name + profession only), "Places visited" (location names + descriptions), "Notes from your handler". `[GM]` prefix on a description line omits it (case-insensitive, leading-whitespace-tolerant).
- New route `GET /sessions/:id/handout` (71 → 72). Server resolves names + descriptions via the existing batched-name helpers, applies the `[GM]` redaction rule, returns `text/markdown` with a slugged filename. Bond/SAN events and NPC secrets/mannerisms/voice/currentGoal are structurally absent from `HandoutInput`.
- `SessionDetailPage` toolbar gains a third action "Download handout" (player-safe). A new Player notes Card holds the player-facing recap separately, EditOnly-gated.
- Tests: 304 → 310 (+6: 4 domain, 2 page).

**Open follow-ups**:
- Optional in-app preview of the handout before download.
- Richer `LinkButton` `<a>` attribute passthrough (currently aria-label/title only).

## Dependencies

Blocked by #027, #015.
