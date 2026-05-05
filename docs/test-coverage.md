# Test coverage

Domain unit-test coverage. Closes backlog issue #022 (M2).

## Running locally

```sh
pnpm test:coverage
```

Text summary plus HTML report in `coverage/index.html`. Exits non-zero
if any in-scope file falls below the thresholds; CI runs the same command.

## Threshold policy

Per ADR-005 (pure-TS domain), coverage targets are enforced **per-file**
(`thresholds.perFile: true` in `vite.config.ts`):

| metric     | threshold |
| ---------- | --------- |
| lines      | 80%       |
| functions  | 80%       |
| branches   | 70%       |
| statements | 80%       |

Scope (`coverage.include`): `domain/**/*.ts`. Excluded:
`**/*.test.ts`, `**/*.d.ts`, and `domain/searchMatch.ts` (in-memory matcher
covered by perf tests, not behavioural line coverage).

## Issue #022 acceptance criteria → tests

| AC bullet                                              | Test files                                         |
| ------------------------------------------------------ | -------------------------------------------------- |
| Char-gen field math                                    | `domain/pc.test.ts`, `domain/npc.test.ts`, `domain/skillPackages.test.ts` |
| SAN mutation including breaking-point detection        | `domain/sanity.test.ts`                            |
| Bond damage application                                | `domain/bonds.test.ts`                             |
| Clue-delivery state transitions                        | _Deferred to issue #025 (M3)_                      |
| MD scenario import parsing                             | `domain/mdImport.test.ts`                          |

## Other in-scope domain modules

`mdExport.ts`, `edges.ts`, `session.ts`, `factionStatus.ts`, plus the
schema-only modules (`clue.ts`, `faction.ts`, `item.ts`, `location.ts`,
`scenario.ts`, `scene.ts`) are all under the same threshold policy and
covered by their adjacent `*.test.ts` files.

## Open follow-ups

- Issue #025 (M3): clue-delivery state-transition unit tests, currently
  deferred per the issue spec.
