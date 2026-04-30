---
id: 015
title: Implement per-entity Markdown export
milestone: M2
unit: M2 — Core Workbench
status: not-started
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

## Dependencies

Blocked by #009.
