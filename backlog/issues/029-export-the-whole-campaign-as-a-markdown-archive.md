---
id: 029
title: Export the whole campaign as a Markdown archive
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
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

## Dependencies

Blocked by #015, #014.
