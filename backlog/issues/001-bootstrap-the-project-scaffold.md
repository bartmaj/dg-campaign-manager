---
id: 001
title: Bootstrap the project scaffold
milestone: M1
unit: M1 — Foundation
status: not-started
labels: [scaffold, ops, testing]
req-ids: [REQ-N08, REQ-N09, REQ-N11]
---

# Bootstrap the project scaffold

## Narrative
**As** the Prepping GM (Bartosz)
**I want** a greenfield Vite + React + TS repo with lint, format, test, hooks, and CI
**So that** every subsequent commit lands on a quality-gated foundation

## Acceptance Criteria

```gherkin
Given an empty repository
When I run the project init scripts and push to main
Then the dev server boots locally
And `pnpm build` produces a deployable bundle
And ESLint and Prettier are configured
And TypeScript is set to strict mode
And Vitest runs with at least one passing smoke test
And Husky + lint-staged block commits with lint or type errors
And GitHub Actions runs lint + typecheck + test on PR and main
```

## REQ Traceability
- REQ-N08 — TypeScript strict mode + linting (ESLint + Prettier configured; all committed code passes both)
- REQ-N09 — Unit testing baseline (Vitest configured for critical domain logic)
- REQ-N11 — Foundational scaffold (Vite + React + TS, ESLint, Prettier, Vitest, Drizzle, libSQL client, Vercel deploy config, git hooks, README)

## Implementation Notes

Foundational story for `/ignite:kickoff`. Vercel deploy wiring is a separate story to keep concerns isolated.

## Dependencies

None — foundational story.
