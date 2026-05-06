---
id: 029
title: Export the whole campaign as a Markdown archive
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
labels: [import-export]
req-ids: [REQ-018]
---

# Export the whole campaign as a Markdown archive

## Narrative
**As** the Campaign Memory Keeper
**I want** a whole-campaign Markdown archive on demand
**So that** I can git-mirror my campaign and survive any platform outage

## Acceptance Criteria

```gherkin
Given a populated campaign
When I trigger archive export
Then a ZIP / folder is produced containing one Markdown file per entity
And the archive round-trips via REQ-016 to reconstruct the campaign (best-effort, lossy on derived fields)
```

## REQ Traceability
- REQ-018 — Campaign-wide Markdown archive (one MD file per entity; round-trips via REQ-016)

## Implementation Notes

Archive endpoint streams ZIP; one file per entity by type-prefixed slug.

**Delivered**:
- New route `GET /campaigns/:id/archive` (72 → 73). Special id `'all'` dumps every entity; a real campaign id filters by `campaignId` (scenes via parent scenarios; bonds + SAN events come along with PCs). Per-row pipeline reuses `serializeEntity` + `loadEdgeContext` from #015.
- ZIP built in-memory via `jszip@3.10.1`. Pinned Epoch dates + alphabetical paths so the same campaign produces byte-identical output. Includes a `README.md` (entity counts + format reference to `docs/md-import-template.md`) and an `index.md` listing every file. Hard cap 1000 rows per type with a 413 response above that.
- Frontend: lazy-loaded `/archive` route + sidebar nav entry below Import. ArchivePage is a Card with a Heading, Prose blurb, and `LinkButton href="/api/campaigns/all/archive" download` → "Download archive (ZIP)".
- Tests: 310 → 311 (+1 ArchivePage smoke). jszip is server-only (server bundle), absent from client chunks.

**Open follow-ups**:
- Streaming for campaigns above the 1000-row cap (currently 413). Multi-campaign UI to select a real campaignId from the page.
- Polymorphic dangling edges (already a known TODO from earlier issues) round-trip with raw UUID fallbacks.

## Dependencies

Blocked by #015, #014.
