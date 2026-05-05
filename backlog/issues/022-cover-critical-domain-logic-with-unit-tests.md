---
id: 022
title: Cover critical domain logic with unit tests
milestone: M2
unit: M2 — Core Workbench
status: done
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

**Delivered**:
- `pnpm test:coverage` runs Vitest with v8 coverage (text + html). Scope is `domain/**/*.ts`. Per-file thresholds enforced: lines 80, functions 80, branches 70, statements 80.
- All-files coverage: stmts 95.23%, branch 79.83%, func 94.11%, lines 96.61%. Each file clears its threshold; `bonds.ts` and `sanity.ts` are 100% across the board.
- Added 11 targeted tests pushing thinner files (mdImport 70 → 80%, mdExport 66 → 76%) past the threshold rather than lowering it.
- CI workflow runs `pnpm test:coverage` so failing thresholds fail the PR.
- `docs/test-coverage.md` maps each AC bullet to its test files and documents threshold policy.

**AC mapping**:
- char-gen field math → `domain/pc.test.ts`, `domain/npc.test.ts`, `domain/skillPackages.test.ts`
- SAN mutation + breaking-point detection → `domain/sanity.test.ts`
- Bond damage application → `domain/bonds.test.ts`
- Clue-delivery state transitions → **deferred to #025** per the issue spec
- MD scenario import parsing → `domain/mdImport.test.ts`

**Open follow-ups**:
- Clue-delivery state-transition coverage lands with #025 in M3.

## Dependencies

Blocked by #007, #011, #012, #014. Clue-delivery test coverage extends in M3 alongside #025.
