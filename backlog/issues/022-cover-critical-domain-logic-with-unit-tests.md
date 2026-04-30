---
id: 022
title: Cover critical domain logic with unit tests
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [testing, domain]
req-ids: [REQ-N09]
---

# Cover critical domain logic with unit tests

## Narrative
**As** the Prepping GM
**I want** Vitest covering char-gen math, SAN/Bond mutation, clue-delivery transitions, and MD import parsing
**So that** mechanical correctness is enforced on every commit

## Acceptance Criteria

```gherkin
Given the domain modules
When CI runs Vitest on a PR
Then unit tests for char-gen field math pass
And unit tests for SAN mutation including breaking-point detection pass
And unit tests for Bond damage application pass
And unit tests for clue-delivery state transitions pass
And unit tests for MD scenario import parsing pass
```

## REQ Traceability
- REQ-N09 — Unit testing baseline (Vitest covering critical domain logic — char gen, SAN/Bond mutation, clue-delivery, MD import parsing)

## Implementation Notes

All tests run against pure-TS domain modules with no React or Drizzle imports (ADR-005).

## Dependencies

Blocked by #007, #011, #012, #014. Clue-delivery test coverage extends in M3 alongside #025.
