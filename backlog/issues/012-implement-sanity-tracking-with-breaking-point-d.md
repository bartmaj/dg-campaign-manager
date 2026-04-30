---
id: 012
title: Implement Sanity tracking with breaking-point detection
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [data-model, domain, ui]
req-ids: [REQ-007]
---

# Implement Sanity tracking with breaking-point detection

## Narrative
**As** the GM at the Table
**I want** SAN tracked as current/max with breaking points, adapted-to, disorders, and change log
**So that** SAN loss is mechanically faithful and breaking-point crossings are flagged

## Acceptance Criteria

```gherkin
Given a PC with SAN 50/65 and breaking-point thresholds defined
When I apply a 5-point SAN loss with a source
Then current SAN is 45
And the loss event is logged with timestamp and source
Given a SAN loss that crosses a breaking-point threshold
When the mutation is applied
Then the system flags the breaking-point crossing
```

## REQ Traceability
- REQ-007 — Sanity tracking (current SAN, maximum SAN, breaking points, adapted-to, disorders, SAN change log)

## Implementation Notes

Breaking-point detection lives in `Domain.sanity` for unit testability (ADR-005).

## Dependencies

Blocked by #005.
