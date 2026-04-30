---
id: 021
title: Hit page navigation latency target
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [performance, ui]
req-ids: [REQ-N02]
---

# Hit page navigation latency target

## Narrative
**As** the GM at the Table
**I want** entity-to-entity navigation under 500ms
**So that** the tool stays out of my way at the table

## Acceptance Criteria

```gherkin
Given a deployed Vercel staging environment with representative data
When I click any entity link from any list or detail page
Then the destination page is rendered within 500ms on a typical broadband connection
```

## REQ Traceability
- REQ-N02 — Page navigation latency (<500ms entity-to-entity)

## Implementation Notes

Achieved via TanStack Query cache + small payloads + edge-region functions.

## Dependencies

Blocked by #018, #017.
