---
id: 005
title: Implement the DG RAW PC schema
milestone: M1
unit: M1 — Foundation
status: not-started
labels: [data-model, domain, ui]
req-ids: [REQ-004]
---

# Implement the DG RAW PC schema

## Narrative
**As** the Prepping GM
**I want** a PC entity with all DG RAW fields (stats, derived attrs, skills, profession, motivations, backstory hooks)
**So that** I can store rules-faithful PCs from session zero onward

## Acceptance Criteria

```gherkin
Given the PC create form
When I enter a valid DG PC (STR/CON/DEX/INT/POW/CHA, derived HP/WP/BP/SAN max, skills, profession, motivations, backstory hooks)
Then the PC is persisted and round-trips through the detail page
And derived attributes are computed from base stats by the domain module
And Bonds and SAN block structures are stubbed (full mechanics in M2)
```

## REQ Traceability
- REQ-004 — PC entity with DG RAW fields (profession, statistics, derived attributes, skills, motivations, Bonds, SAN block, backstory hooks)

## Implementation Notes

Bond and SAN structures are present but inert until M2.2B.

## Dependencies

Blocked by #004.
