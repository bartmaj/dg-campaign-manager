---
id: 015
title: Implement per-entity Markdown export
milestone: M2
unit: M2 — Core Workbench
status: done
labels: [import-export, domain]
req-ids: [REQ-017, REQ-N04]
---

# Implement per-entity Markdown export

## Narrative
**As** the Campaign Memory Keeper
**I want** every entity exportable as a single Markdown file
**So that** my campaign data is portable and never trapped in one vendor

## Acceptance Criteria

```gherkin
Given any entity with fields and outgoing relationships
When I click "Download as Markdown"
Then a deterministic Markdown file is downloaded
And the file contains the entity's fields and outgoing relationships
And the file's content is stable across exports of the same unchanged entity
```

## REQ Traceability
- REQ-017 — Per-entity Markdown export (deterministic single-file MD per entity)
- REQ-N04 — Markdown export portability (every entity exportable at any time)

## Implementation Notes

Serializer is pure TS in `Domain.mdExport.serialize()`.

**Delivered**:
- `domain/mdExport.ts` — pure-TS deterministic serializer with discriminated-union `ExportInput` over all 9 detail-page entity types. Local structural types kept in the domain module so the server build (which doesn't include `src/`) compiles cleanly. Determinism contract documented at the top: stable sorts on every collection, no createdAt/updatedAt leakage, single trailing newline, `\n` only.
- 9 export endpoints under `api/{entity}/[id]/export.ts` returning `text/markdown; charset=utf-8` with `Content-Disposition: attachment; filename={type}-{slug}.md`. Shared helpers in `api/_lib/export.ts` batch the related-entity name lookups so wiki-links resolve to `[[Name]]` (with `<uuid> <!-- id: … -->` fallback).
- "Download as Markdown" `<a href download>` placed next to the H1 on each detail page (no JS required).
- Tests: 171 → 194 (+23). 21 in `domain/mdExport.test.ts` covering each entity type, idempotence, edge-order invariance, no-`createdAt` leakage, slug normalization, and a smoke round-trip through `mdImport` for the wiki-link layer.

**Open follow-ups**:
- REQ-018 / #029 — campaign-wide ZIP archive composing per-entity exports plus `index.md`.
- "Bonds with this PC" (incoming) on PC export — currently only the PC's own bonds are emitted.
- Per-NPC owned items / faction roster expansion — currently surfaced via edges, not denormalized.

## Dependencies

Blocked by #009.
