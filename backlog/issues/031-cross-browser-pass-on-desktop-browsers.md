---
id: 031
title: Cross-browser pass on desktop browsers
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
labels: [testing, ops]
req-ids: [REQ-N06]
---

# Cross-browser pass on desktop browsers

## Narrative
**As** the GM at the Table
**I want** the app verified on Chrome, Firefox, and Safari (latest two each)
**So that** I'm not surprised by a rendering bug at the table

## Acceptance Criteria

```gherkin
Given the deployed production environment
When I manually exercise core flows (Cmd-K, list filtering, character form, MD import, mark clue delivered, session report)
Then each flow completes without blocking visual or functional bugs on Chrome, Firefox, and Safari (latest two stable each)
```

## REQ Traceability
- REQ-N06 — Desktop browser support (latest two stable Chrome/Firefox/Safari; mobile out of scope)

## Implementation Notes

Manual smoke pass; no Playwright/Selenium harness in v1.

## Dependencies

Blocked by #024, #025, #027, #016, #017, #014.
