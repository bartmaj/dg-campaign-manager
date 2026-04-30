---
id: 014
title: Implement bulk Markdown scenario import
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [import-export, domain, testing]
req-ids: [REQ-016]
---

# Implement bulk Markdown scenario import

## Narrative
**As** the Prepping GM
**I want** to import an entire published scenario from a structured Markdown document
**So that** transcribing modules does not cost more than running them

## Acceptance Criteria

```gherkin
Given a valid scenario Markdown file conforming to the documented template
When I upload it to /api/import/scenario
Then a Scenario, its Scenes, NPCs, Clues, Items, Locations, and inter-entity relationships are created in one transaction
And the import is atomic — partial imports are rejected
Given an invalid scenario Markdown file
When I upload it
Then validation errors are returned with line and field references
And no partial records are persisted
```

## REQ Traceability
- REQ-016 — Bulk import from Markdown template (atomic transactional ingest of Scenario + Scenes + NPCs + Clues + Items + Locations + relationships)

## Implementation Notes

Parser is pure TS in `Domain.mdImport`; DB write is a thin transactional wrapper. First import of a real published Arc Dream scenario is the v1 acceptance gate.

## Dependencies

Blocked by #009, #010, #008.
