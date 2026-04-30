# Architecture Audit — Delta Green Campaign Manager

This is the debug record for the architecture phase. It accumulates Q&A and assumption logs from each architecture sub-skill (milestones, tech-spec, staffing) as they execute.

---

## Milestones
_Completed: 2026-04-30_

# Milestones Clarification Q&A

No clarifying questions were raised with the user (orchestrated mode, autonomous execution). Decisions made from PRD content with the following best-judgment assumptions logged below.

## Assumptions & Decisions Log

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| 1 | Three milestones: Foundation, Core Workbench, Campaign-Run-Ready | Small project (1 dev, 4-6 weekends). Adaptation guideline says 2-3 milestones. Three gives a natural billing-gate equivalent (self-acceptance gates) and matches the natural phase boundaries: (a) build skeleton + entities, (b) make it usable for prep, (c) make it usable at the table | Sequence and gate count |
| 2 | Single workstream — no parallel teams | Sole developer; full-stack web app; no need for workstream dependency diagram | Omit ASCII workstream diagram per "single-workstream" edge case |
| 3 | Repo scaffolding lives in M1 group 1A | Per Key Principles: scaffolding is always Milestone 1's first deliverable group | M1 starts with project init; REQ-N11 satisfied here |
| 4 | Equal billing splits, framed as self-acceptance gates (no client invoice) | Personal project — no real billing — but the gate cadence still serves as a self-imposed checkpoint | Billing table kept for consistency with template |
| 5 | Investigation graph viz (REQ-022) and char-gen wizard (REQ-021) deferred out of milestones | Both Could-Have per PRD; v1 gates are Must-Haves only | Listed under Post-v1 / deferred |
| 6 | Bulk MD import (REQ-016) sits in M2 (Core Workbench), not M1 | Import requires the entity model to be settled, but it's the v1 acceptance gate (PRD §6.2.4) — must land before play-mode polish in M3 | Risk-aligned: the highest-risk feature is exercised mid-project, leaving M3 for play-mode polish on real data |
| 7 | Play mode (REQ-019/020) and auto-derived session report (REQ-011) sit in M3 | Both are at-the-table features; only meaningful once real campaign data exists. Aligns with v1 acceptance criterion of running an end-to-end session through the tool | M3 is the launch gate |
| 8 | AI leverage assumed Heavy across most deliverables | Greenfield TS/React app with mainstream stack; AI agents excel at scaffolding, schema/migration generation, CRUD UI, MD parsers. Minimal-leverage items are limited to the manual at-table validation play-through | Honest leverage profile, not aspirational |

---

# Milestones — Delta Green Campaign Manager

## Billing & Self-Acceptance Structure

This is a personal project; "billing" gates are self-acceptance checkpoints. The structure is preserved for traceability.

| Payment | Trigger | Amount |
|---------|---------|--------|
| **Gate 1 — Kickoff** | Project start, scope locked | 25% |
| **Gate 2 — Foundation Accepted** | Milestone 1 accepted | 25% |
| **Gate 3 — Core Workbench Accepted** | Milestone 2 accepted | 25% |
| **Gate 4 — Launch (v1 Done)** | Milestone 3 accepted + first live session run end-to-end | 25% |

## Milestone Sequence

| Order | Milestone | Primary Focus |
|-------|-----------|---------------|
| 1 | **Foundation** | Repo scaffolding, deployment pipeline, schema + migrations, core entity CRUD (PC, NPC, Faction, Location, Item) |
| 2 | **Core Workbench** | Investigation graph (Clues + typed edges), Sessions, Bonds + Sanity, MD bulk import, MD per-entity export, Cmd-K, list views, entity detail relationship surfaces |
| 3 | **Campaign-Run-Ready** | Prep/play mode split, play-mode primary actions, auto-derived session report, campaign archive export, end-to-end run-through against an imported published scenario |

> **Note on timeline and effort:** This document defines *what* gets delivered and in *what order*. For calendar duration, engineering effort, and staffing, see Appendix D (Staffing) of `ideate/architecture.md`.

## AI Leverage Key

| Rating | Meaning | Impact on Effort |
|--------|---------|-----------------|
| **Heavy** | AI agents generate the bulk of the code/output; engineer focuses on review and refinement | 60–80% faster than traditional development |
| **Moderate** | AI assists significantly but integration, debugging, or DG-rules-faithful judgment requires substantial human input | 30–50% faster than traditional development |
| **Minimal** | Work is primarily human-gated (manual run-through at the table, DG RAW correctness review, ergonomics tuning) | 0–20% faster than traditional development |

---

## Milestone 1: Foundation

### Features

| Feature | Description | Requirements |
|---|---|---|
| Project scaffold | Vite + React + TS app, lint/format/test toolchain, git hooks, Vercel deploy wired | REQ-N08, REQ-N09, REQ-N11, REQ-N12 |
| Data layer | Turso (libSQL) connection, Drizzle ORM, migration tooling, baseline schema | REQ-N10, INT-001 |
| Typed entity model (baseline) | Campaign (implicit), Scenario, Scene, NPC, PC, Faction, Location, Item entities with stable schemas, create/list/detail pages | REQ-001, REQ-002 |
| PC entity (DG RAW fields) | Full DG RAW PC schema: stats, derived attrs, skills, profession, motivations, backstory hooks (Bonds + SAN structures stubbed; full mechanics in M2) | REQ-004 |
| NPC entity | Stat block + RP hooks + faction ref + status + relationships | REQ-005 |
| Character form with skill-package presets | Shared PC/NPC editor; profession presets pre-fill DG RAW skill values | REQ-008 |
| Faction entity | Name, agenda, member NPCs, status timeline | REQ-025 |
| Location entity (baseline) | Name, description, owner refs (link surfaces deferred to M2) | REQ-024 (partial) |
| Item entity | Name, description, current location, owner | REQ-026 |
| Single-user access model | No interactive auth; env-credential gating | REQ-N03 |

### Definition of Done

- [ ] All M1 features implemented and pass acceptance criteria
- [ ] Schema reproducible from migrations on a fresh DB
- [ ] App deployed to Vercel; staging URL functional
- [ ] CI runs lint + typecheck + tests on every push, all green
- [ ] `strict: true` TypeScript; zero ESLint errors on commit
- [ ] Vitest configured; smoke test for at least one domain mutation passes
- [ ] README documents local dev setup + Turso provisioning
- [ ] Manual self-test: can create one PC, one NPC, one Faction, one Location, one Item in the deployed app

**Gate 2 (25%) triggered upon acceptance — all DoD items checked.**

### 1A — Repository Scaffolding

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Project initialization | Vite + React + TypeScript scaffold; pnpm or npm; folder layout | App boots locally; `dev` and `build` scripts succeed | Heavy |
| Dev tooling | ESLint + Prettier + tsc strict; Husky + lint-staged | Pre-commit blocks lint/type errors | Heavy |
| Test infrastructure | Vitest + React Testing Library; coverage config; first smoke test | `test` script runs; coverage report produced | Heavy |
| CI pipeline | GitHub Actions: install, lint, typecheck, test on PR + main | Pipeline green on initial commit | Heavy |
| Deploy pipeline | Vercel project linked; preview deploys per branch; production on main | Push to main produces live deploy | Heavy |

### 1B — Data Layer

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Turso provisioning | Free-tier Turso DB created; libSQL credentials in Vercel env | `pnpm db:status` reports connection | Moderate |
| Drizzle setup | Drizzle ORM configured against libSQL; schema file conventions established | `drizzle-kit generate` + `migrate` work end-to-end | Heavy |
| Initial schema + migration | Tables for Scenario, Scene, NPC, PC, Faction, Location, Item; FK constraints | Migration applies clean on a fresh DB | Heavy |
| Seed/fixture script | Dev-only seed inserting representative entities | `pnpm db:seed` populates a usable dev DB | Heavy |

### 1C — Entity CRUD & Character Form

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Entity routing & layout | Route shells for each entity type: list, detail, create/edit | All entity routes resolve and render placeholder UI | Heavy |
| Generic CRUD components | Reusable form/list/detail components driven by entity schema | One component set serves all 7 entities | Heavy |
| PC schema implementation | Full DG RAW field set on the PC entity | A valid DG PC can be saved and round-tripped | Moderate |
| NPC schema implementation | NPC stat block + RP hooks + status + faction ref | A valid DG NPC can be saved and round-tripped | Moderate |
| Skill-package presets | Profession → skill values mapping for DG RAW skill packages | Selecting "Federal Agent" pre-fills the package; manually editable | Moderate |
| Faction / Location / Item editors | Forms + detail views for the remaining baseline entities | Each entity creatable, editable, viewable | Heavy |

### Level 2 Decomposition (M1)

```
┌─────────────────────────────────────────────────────────┐
│  Foundation                                             │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Web App     │───▶│  Drizzle ORM │───▶│  Turso DB │ │
│  │  (Vite/React)│    │  (schema +   │    │  (libSQL) │ │
│  │              │    │   migrations)│    │           │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│         │                                               │
│         └───── Vercel hosting (env-bound creds) ────────│
│                                                         │
│  Subcomponents:                                         │
│  • Entity Schema Module — types per entity, validators  │
│  • Repository Module — Drizzle queries per entity       │
│  • Form/List/Detail UI Kit — generic, schema-driven     │
│  • Char Form Module — DG RAW field tree + skill presets │
└─────────────────────────────────────────────────────────┘
```

Key M1 decisions:
- Entity schema is the single source of truth: TS types, DB schema, and form fields all derive from it.
- Drizzle migrations are the only path to schema changes; no ad-hoc SQL in code.
- One generic CRUD layer; entity-specific UI is opt-in customization on top.

---

## Milestone 2: Core Workbench

### Features

| Feature | Description | Requirements |
|---|---|---|
| Typed relationships | First-class typed edges (Clue↔Clue, Clue→NPC, Clue→Faction, Clue→Location, Clue→Item, Clue→Scene, NPC↔NPC, NPC→Faction, NPC→Location, Item→Location, Scene→Location) | REQ-003 |
| Clue entity with provenance | Clue + origin Scenario + typed edges | REQ-009 (provenance + edges) |
| Bonds | First-class Bond entity: source PC, target, value, max, damage log | REQ-006 |
| Sanity tracking | SAN block on PC: current/max, breaking points, adapted-to, disorders, change log | REQ-007 |
| Session entity + hybrid timeline | Session with IRL date + in-game date range; in-game and real-session views | REQ-010 |
| Bulk MD scenario import | Structured MD/YAML scenario template; one-shot import creating Scenario + Scenes + NPCs + Clues + Items + Locations + relationships | REQ-016 |
| Per-entity MD export | "Download as Markdown" for any entity | REQ-017, REQ-N04 |
| Cmd-K global search | Keyboard-first palette across all entity types; <1s on 1,000 entities | REQ-013, REQ-N01 |
| List views with filtering | Per-entity list with type-appropriate filters (faction, status, location, scenario) | REQ-014 |
| Entity detail surfaces relationships | Incoming + outgoing typed relationships shown on every detail page | REQ-015 |
| Location surfaces local context | Linked clues, present NPCs, items, prior session events at a Location | REQ-024 (full) |
| Faction status timeline | Ordered status notes on Faction; member NPCs + implicating clues panel | REQ-025 (full) |
| Page navigation latency | <500ms entity → entity navigation | REQ-N02 |
| Domain unit tests | Char-gen field math, SAN/Bond mutation, clue-delivery transitions, MD import parsing | REQ-N09 |

### Definition of Done

- [ ] All M2 features implemented and pass acceptance criteria
- [ ] At least one published Arc Dream scenario imports successfully end-to-end via REQ-016
- [ ] Cmd-K returns results within 1s on a 1,000-entity dataset (REQ-N01)
- [ ] Page navigation measured <500ms on Vercel staging (REQ-N02)
- [ ] Vitest covers char-gen math, SAN/Bond mutations, clue-delivery transitions, and MD import parsing
- [ ] Drizzle migrations applied cleanly on staging
- [ ] Per-entity MD export round-trips for representative entities
- [ ] Zero P0 bugs; P1 bugs documented
- [ ] README covers MD scenario template format

**Gate 3 (25%) triggered upon acceptance — all DoD items checked.**

### 2A — Investigation Graph

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Relationships table & API | Polymorphic typed-edge table with kind, source, target | All REQ-003 relationship kinds expressible | Heavy |
| Clue entity | Title, description, origin Scenario, typed edges, delivery state stub | A Clue can be linked to NPC + Faction + Location simultaneously | Heavy |
| Reverse-ref surfacing | Faction page lists "Implicating clues"; NPC page lists referencing entities | Required surfaces present on every detail page | Heavy |
| Domain tests | Edge insert/remove, polymorphism integrity, reverse-ref correctness | Tests pass on CI | Heavy |

### 2B — DG Mechanics: Bonds & Sanity

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Bond entity & UI | Source PC + target + value/max + damage log | Bond damage event reduces value and logs reason + session ref | Moderate |
| SAN block & UI | Current/max, breaking points, adapted-to, disorders, change log | SAN loss decrements current; breaking-point crossings flagged | Moderate |
| Mechanic unit tests | Bond/SAN mutation math; breaking-point detection | Tests pass | Heavy |

### 2C — Sessions & Timeline

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Session entity | IRL date + in-game date range + freeform notes field | Session creatable; both date axes stored | Heavy |
| Timeline views | In-game-ordered view + real-session-ordered view | Both views render correct ordering | Heavy |

### 2D — Import / Export / Retrieval

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| MD scenario template spec | Documented YAML+MD format for Scenario + Scenes + NPCs + Clues + Items + Locations + edges | Template stable + documented in README | Moderate |
| Bulk MD importer | Parser + validator + transactional write | Valid scenario imports atomically; errors point to line/field | Moderate |
| Per-entity MD export | Deterministic MD output per entity | Exported MD parses back into a viewable entity (best-effort) | Heavy |
| Cmd-K palette | Keyboard-first global search; indexed name search across entities | <1s on 1,000-entity fixture | Moderate |
| List views + filters | Per-entity list with relevant facets | Filter by faction, status, location, scenario works | Heavy |

### Level 2 Decomposition (M2)

```
┌──────────────────────────────────────────────────────────────┐
│  Core Workbench                                              │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Investigation      │    │  DG Mechanics               │ │
│  │  Graph Module       │    │  • Bond service             │ │
│  │  • Edge repository  │    │  • SAN service              │ │
│  │  • Reverse-ref API  │    │  • Mutation event log       │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Session Module     │    │  Import / Export Module     │ │
│  │  • Hybrid timeline  │    │  • MD scenario parser       │ │
│  │  • Event tagging    │    │  • Per-entity MD serializer │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────┐                                    │
│  │  Retrieval Module   │                                    │
│  │  • Cmd-K palette    │                                    │
│  │  • List + filter UI │                                    │
│  └─────────────────────┘                                    │
└──────────────────────────────────────────────────────────────┘
```

Key M2 decisions:
- Polymorphic edge table over per-pair junction tables — fewer migrations as relationship kinds grow.
- MD import is transactional; partial imports rejected.
- Cmd-K indexes denormalized names client-side for sub-1s response (server fetch on cold load only).

---

## Milestone 3: Campaign-Run-Ready

### Features

| Feature | Description | Requirements |
|---|---|---|
| Distinct prep/play modes | Top-level mode switch; play mode read-optimized, primary actions surfaced | REQ-019 |
| Play-mode primary actions | One-click/keystroke for: open Cmd-K, mark clue delivered, log SAN change, log Bond damage, jump to current Session | REQ-020 |
| Clue delivery tracking | Marking a clue delivered records session + recipient PCs; "what do players know?" answerable per entity | REQ-009 (delivery half) |
| Auto-derived session report | Tagged entities (NPCs encountered, clues delivered, scenes played, locations visited, SAN/Bond changes) auto-build the session log; freeform notes on top | REQ-011 |
| Player handout export | From a Session, export player-safe MD handout (delivered clues, named NPCs, locations, player-safe notes only) | REQ-012 |
| Campaign-wide MD archive | Whole-campaign MD export suitable for git mirroring | REQ-018 |
| Keyboard-first play mode | Keyboard navigation across all five primary actions + Cmd-K | REQ-N07 |
| Daily DB backup | Turso point-in-time backup verified | REQ-N05 |
| Desktop browser support | Tested on latest two Chrome / Firefox / Safari | REQ-N06 |
| End-to-end campaign run | Successfully run one live session of an imported published scenario through the tool, with no fallback to Obsidian/Notion | §6.2 acceptance |

### Definition of Done

- [ ] All M3 features implemented and pass acceptance criteria
- [ ] Prep/play mode toggle persists across navigation
- [ ] All five play-mode primary actions reachable in ≤1 click or keystroke from any page
- [ ] Auto-derived session report renders all tagged entities with links
- [ ] Campaign archive export produces a directory of MD files; round-trip via REQ-016 reconstructs the campaign best-effort
- [ ] Manual desktop-browser pass on Chrome/Firefox/Safari latest two
- [ ] Turso daily backup verified at least once
- [ ] At least one live session of a real published Arc Dream scenario run end-to-end through the tool without falling back to other notes
- [ ] Zero P0 bugs; outstanding P1 bugs documented with workarounds
- [ ] All Must-Have REQs from PRD §8.3 trace to shipped behavior

**Gate 4 (25%) triggered upon acceptance + first live session run end-to-end (v1 done per PRD §6.2).**

### 3A — Mode Split & At-Table UX

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Mode toggle + theming | Prep/play mode at the app shell level; play mode de-emphasizes editing affordances | Mode visibly distinct; persists in URL/localStorage | Heavy |
| Play-mode primary actions toolbar | Cmd-K, mark clue delivered, log SAN, log Bond damage, jump to Session | All 5 reachable in ≤1 click/keystroke | Moderate |
| Clue delivery flow | Mark-delivered modal captures session + recipient PCs | Delivery state visible on Clue + Session pages | Moderate |
| Keyboard shortcuts | Documented shortcuts for play-mode primary actions | Shortcut overlay (`?` key) lists them | Heavy |

### 3B — Session Report & Exports

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Event tagging hooks | Marking a clue delivered, encountering an NPC, applying SAN/Bond damage all stamp the active Session | All five categories appear in the Session log | Moderate |
| Auto-derived session report UI | Structured event log + freeform notes section on the Session page | Both sections visible; freeform editable | Heavy |
| Player handout exporter | Filter-down + MD output for player-safe entities | GM-only fields excluded from the export | Moderate |
| Campaign archive exporter | Full-campaign MD archive (zip or folder) | Archive contains one file per entity; importable best-effort | Heavy |

### 3C — Hardening & Run-Through

| Deliverable | Description | Acceptance Criteria | AI Leverage |
|---|---|---|---|
| Cross-browser pass | Manual test on Chrome, Firefox, Safari (latest two each) | No blocking visual or functional bugs | Minimal |
| Backup verification | Trigger and verify Turso PITR | Recovery rehearsed at least once | Minimal |
| Live-session run-through | Run a live game session of an imported scenario end-to-end | No fallback to Obsidian/Notion during the session; post-session debrief records gaps | Minimal |
| Bug fixes from run-through | Triage and resolve issues surfaced by the run-through | All P0 closed; P1 closed or documented | Moderate |

### Level 2 Decomposition (M3)

```
┌─────────────────────────────────────────────────────────────┐
│  Campaign-Run-Ready                                         │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  App Shell           │    │  Event Tagging           │  │
│  │  • Mode toggle       │    │  • Clue delivery         │  │
│  │  • Play toolbar      │    │  • SAN/Bond mutations    │  │
│  │  • Keyboard layer    │    │  • NPC/Scene presence    │  │
│  └──────────────────────┘    └──────────────────────────┘  │
│                                       │                     │
│                                       ▼                     │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Session Report      │    │  Export Module           │  │
│  │  • Auto-derived log  │    │  • Player handout        │  │
│  │  • Freeform notes    │    │  • Campaign archive      │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Key M3 decisions:
- Event tagging is implicit: any mutation in play mode that touches a session-scoped entity stamps the active Session — no extra clicks.
- Mode is global state, not per-page — switching is one keystroke.
- Live-session run-through is the v1 acceptance gate; it is the ultimate test of the tool.

---

## Build Order & Dependency Matrix

| Phase | Depends On | Unblocks |
|-------|-----------|----------|
| M1.1A Scaffolding | — | All later work |
| M1.1B Data Layer | 1A | All entity CRUD |
| M1.1C Entity CRUD + Char Form | 1B | M2 relationships, M2 mechanics |
| M2.2A Investigation Graph | M1 | M2.2D import; M3 clue delivery |
| M2.2B DG Mechanics | M1.1C (PC entity) | M3 SAN/Bond logging |
| M2.2C Sessions | M1 | M3 event tagging; auto-derived report |
| M2.2D Import/Export/Retrieval | 2A, 2B, 2C | M3 export pipeline; v1 acceptance |
| M3.3A Mode Split & UX | M2 | M3 run-through |
| M3.3B Session Report & Exports | 3A, 2C | M3 run-through |
| M3.3C Hardening & Run-Through | 3A, 3B | v1 launch gate |

Single workstream (one developer, one app) — no parallel-stream coordination required.

---

## Story / REQ-ID Mapping Skeleton

This is the seed for the story breakdown phase. Each milestone's deliverable groups will decompose into stories during the staffing/work-breakdown phase. The mapping below ensures every Must / Should REQ from PRD §8.3 has a milestone home; Could-Haves and Won'ts are explicitly out-of-v1.

| REQ-ID | Priority | Milestone | Deliverable Group |
|--------|----------|-----------|-------------------|
| REQ-001 | Must | M1 | 1C |
| REQ-002 | Must | M1 | 1C |
| REQ-003 | Must | M2 | 2A |
| REQ-004 | Must | M1 | 1C |
| REQ-005 | Must | M1 | 1C |
| REQ-006 | Must | M2 | 2B |
| REQ-007 | Must | M2 | 2B |
| REQ-008 | Must | M1 | 1C |
| REQ-009 | Must | M2 + M3 | 2A (provenance/edges), 3A (delivery flow) |
| REQ-010 | Must | M2 | 2C |
| REQ-011 | Must | M3 | 3B |
| REQ-012 | Should | M3 | 3B |
| REQ-013 | Must | M2 | 2D |
| REQ-014 | Must | M2 | 2D |
| REQ-015 | Must | M2 | 2A |
| REQ-016 | Must | M2 | 2D |
| REQ-017 | Must | M2 | 2D |
| REQ-018 | Should | M3 | 3B |
| REQ-019 | Must | M3 | 3A |
| REQ-020 | Must | M3 | 3A |
| REQ-021 | Could | Post-v1 | — (deferred) |
| REQ-022 | Could | Post-v1 | — (deferred) |
| REQ-023 | Won't (v1) | Post-v1 | — (deferred) |
| REQ-024 | Must | M1 + M2 | 1C (baseline), 2A (surfacing) |
| REQ-025 | Must | M1 + M2 | 1C (baseline), 2A (timeline + clues) |
| REQ-026 | Must | M1 | 1C |
| REQ-N01 | Must | M2 | 2D |
| REQ-N02 | Must | M2 | 2A/2D |
| REQ-N03 | Must | M1 | 1A |
| REQ-N04 | Must | M2 | 2D |
| REQ-N05 | Should | M3 | 3C |
| REQ-N06 | Must | M3 | 3C |
| REQ-N07 | Should | M3 | 3A |
| REQ-N08 | Must | M1 | 1A |
| REQ-N09 | Must | M1 + M2 | 1A baseline, M2 domain coverage |
| REQ-N10 | Must | M1 | 1B |
| REQ-N11 | Must | M1 | 1A |
| REQ-N12 | Must | M1 | 1A |
| INT-001 | Must | M1 | 1B |
| INT-002 | Must | M1 | 1A |

All Must-Have and Should-Have REQs are addressed within the v1 milestone plan. Could-Have REQs (REQ-021, REQ-022) and the Won't-Have REQ-023 are explicitly deferred. No requirement is unaddressed.

---

## Key Assumptions

1. **Single developer, weekend cadence.** All deliverable groups assume one developer with no parallel staffing; sequencing is strict because there is no team.
2. **Anchored to a real campaign start.** The user has a published Arc Dream scenario queued and a real campaign to run; v1 acceptance is gated on running an actual session through the tool, not on synthetic test data.
3. **Free-tier infra suffices.** Turso + Vercel free tiers are assumed sustainable indefinitely at single-user scale (PRD A-2).
4. **No external auth or secrets management.** Access is gated by deployment URL privacy + env-bound DB credentials only (REQ-N03).
5. **MD scenario template can express the full entity model without becoming awkward to author** (PRD A-4); first published-scenario import is the validation gate.
6. **AI leverage is high for greenfield React + TS + Drizzle work.** The "Heavy" leverage rating is honest, not aspirational, for scaffolding and CRUD layers; DG-rules-faithful work (char gen, mechanics) is "Moderate".
7. **No QA team.** "Acceptance" is self-acceptance through deployment + run-through; the only external validation is the live-session test.

## Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep in M2 (graph + mechanics + import + export + Cmd-K is heavy) | M2 slips, M3 compresses, v1 misses campaign start | Strict MoSCoW; defer Could-Haves; cut features rather than extend; M2 DoD is the cut line |
| MD scenario template ergonomics | If template is awkward, REQ-016 import becomes the failure mode the entire project hinges on | Template designed against a real published scenario; first import is the validation gate; iterate template before deepening other features |
| Drizzle/libSQL graph-query ergonomics | Polymorphic edges + reverse refs are non-trivial in SQL; could bog down M2.2A | Spike the edge schema in M1.1B as a stretch; if ergonomics fail, fall back to per-pair junction tables before M2 starts |
| Run-through reveals fundamental UX gap | Late discovery in M3 forces M2/M3 rework | M2 deliberately uses the tool for own-prep work; signal-gathering before M3 hardening |
| Single developer drift | No external pressure → indefinite slip | Anchor each milestone to a calendar weekend count; cut features hard at gate boundaries |
| Backup gap | Turso outage = lost campaign | REQ-N04/REQ-017/REQ-018 ensure MD export is always available; user can git-mirror archive for DR |

## Milestone Summary

| Milestone | Deliverable Groups | Total Deliverables | Leverage Profile | Self-Acceptance Gate |
|-----------|--------------------|--------------------|-----------------|----------------------|
| **M1: Foundation** | 3 groups (1A/1B/1C) | 14 | Mostly Heavy | Gate 2 (25%) |
| **M2: Core Workbench** | 4 groups (2A/2B/2C/2D) | 16 | Heavy + Moderate | Gate 3 (25%) |
| **M3: Campaign-Run-Ready** | 3 groups (3A/3B/3C) | 12 | Mixed; 3C Minimal-Moderate | Gate 4 (25%) |
| **TOTAL** | **10 groups** | **42** | | **100%** |

---

> **Note on timeline and effort:** This document defines *what* gets delivered and in *what order*. For calendar duration, engineering effort, and staffing, see Appendix D (Staffing) of `ideate/architecture.md` (produced by the staffing phase).

---

## Tech Spec
_Completed: 2026-04-30_

# Architecture Clarification Q&A

No clarifying questions were raised with the user (orchestrated mode, autonomous execution; `skip-steps: [6]` per execution context). Architectural decisions were derived from PRD content with the assumptions table below.

## Assumptions & Decisions Log

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| 1 | Single deployable project — Vercel-hosted Vite + React SPA with co-located Vercel Serverless Functions for Turso access | PRD §3.3 fixes the stack; single-user app at free-tier scale doesn't justify a separate backend service | One repo, one deploy; no service boundary to maintain |
| 2 | Turso libSQL accessed exclusively via Vercel Serverless Functions (no client-side DB credentials) | REQ-N03 — env-credential gating; exposing libSQL credentials to the browser would invert the trust model | All mutations and queries go through `/api/*` endpoints; Drizzle runs server-side |
| 3 | Drizzle ORM in both TypeScript app code and `drizzle-kit` migrations; schema is single source of truth | REQ-N10 + the milestones note "entity schema is the single source of truth" | Schema drives DB tables, TS types, validators, and form definitions |
| 4 | Polymorphic typed-edge table for relationships (one `relationships` table with `kind`, `source_type`, `source_id`, `target_type`, `target_id`) | Per M2 key decision; per-pair junction tables would mean a migration per relationship kind | Trade-off: weaker FK integrity per pair; mitigated by app-level validation + indexes |
| 5 | Cmd-K palette uses denormalized client-side index loaded once per session | REQ-N01 (<1s on 1,000 entities) is impossible across a network round-trip; client-side fuzzy search is the only viable approach | Server exposes a `/api/search/index` endpoint returning a compact name/type/id list; refresh on mutation |
| 6 | TanStack Query for server state, react-hook-form + Zod for forms, Tailwind CSS for styling | Mainstream React stack; minimizes bespoke patterns; fits user's existing project conventions | Documented as default; substitutable later |
| 7 | Markdown import parser uses YAML front-matter + heading-scoped sections; runs server-side in a Vercel Function with transactional writes | REQ-016 must be atomic; transaction control requires server-side execution | Import endpoint accepts file upload, parses, validates, commits in one libSQL transaction |
| 8 | No staging environment beyond Vercel preview deploys per branch | Single dev, free tier, no team — separate staging adds cost without benefit | Preview deploys serve as staging; production = `main` branch |
| 9 | Error tracking and analytics deferred to post-v1 | PRD §5.3 — no analytics/error reporting in v1 | Console + Vercel function logs only; revisit if real bugs surface |
| 10 | Sentry, OpenTelemetry, and any observability tooling explicitly excluded from v1 | Single-user, low-volume, free-tier-only constraint | Logs via Vercel dashboard; if a bug needs deeper inspection, ad-hoc instrumentation in the offending function |
| 11 | Backups rely on Turso's platform PITR; no application-level backup pipeline | REQ-N05 (Should), R-6 mitigation; user can also git-mirror MD archives | Daily verification once at setup; no scheduled job needed |
| 12 | Domain logic (char-gen math, SAN/Bond mutation, clue-delivery transitions, MD parsing) lives in pure TypeScript modules independent of React/Drizzle | REQ-N09 — these need unit tests; coupling them to UI or DB makes tests heavier | A `domain/` directory with no React or Drizzle imports |

---

# Architecture — Delta Green Campaign Manager

## Solution Strategy

| Goal (from PRD) | Approach | Key Technologies |
|---|---|---|
| Persistent, queryable campaign memory | Typed entities + first-class typed edges in a relational DB | Turso (libSQL), Drizzle ORM |
| Sub-second at-table retrieval | Client-side denormalized search index for Cmd-K | In-memory JS index, fuzzy match library (e.g. `fuse.js` or hand-rolled) |
| DG-rules-faithful PC/NPC modeling | Pure-TS domain modules with explicit types and unit tests | TypeScript strict, Vitest |
| Bulk import of published scenarios | YAML+MD parser running server-side with transactional writes | Vercel Functions, libSQL transactions |
| Markdown portability | Deterministic per-entity MD serializer; whole-campaign archive | Server-side serializer, ZIP generation |
| Workbench-grade UX (prep + play modes) | Single SPA with global mode state and keyboard-first toolbar in play | React + Tailwind, react-hotkeys-hook |
| Single-user free-tier hosting | Static SPA + serverless functions on Vercel | Vercel free tier, Turso free tier |

## Project Breakdown

A single deployable project. The PRD's stack is fixed; no separate frontend/backend split is warranted at this scale.

| Project | Purpose | Tech Stack | Documentation |
|---------|---------|-----------|---------------|
| **DG Campaign Manager (web app)** | Single-user GM workbench: SPA + co-located serverless API | Vite, React 18, TypeScript (strict), Tailwind CSS, TanStack Query, react-hook-form + Zod, Drizzle ORM, libSQL client, Vercel Serverless Functions | [Vite](https://vite.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/docs/), [Tailwind](https://tailwindcss.com/docs), [TanStack Query](https://tanstack.com/query/latest), [react-hook-form](https://react-hook-form.com/), [Zod](https://zod.dev/), [Drizzle](https://orm.drizzle.team/), [Turso/libSQL](https://docs.turso.tech/), [Vercel](https://vercel.com/docs) |

## Separation of Responsibilities

The single project decomposes into clear modules. No service boundary, but module boundaries are enforced via folder structure and dependency direction.

### Web App (Vite + React SPA)

**Owns:** All UI, client-side state, navigation, mode (prep/play), Cmd-K palette, form rendering and validation, optimistic mutations.

| Layer | Responsibility |
|---|---|
| Routing & shell | Route definitions, mode toggle, play-mode toolbar, keyboard shortcut layer |
| Pages / views | List, detail, create/edit per entity type; Session report; Location surfacing panel |
| Form module | react-hook-form + Zod; shared field renderers driven by entity schema |
| Query layer | TanStack Query hooks calling `/api/*`; cache keys per entity; mutation invalidations |
| Cmd-K module | Loads denormalized index on cold start; in-memory fuzzy search; navigation on select |
| Domain module (pure TS) | Char-gen field math, skill-package presets, SAN/Bond mutation rules, clue-delivery state transitions, MD scenario parser, MD entity serializer — no React, no Drizzle imports |

### API Layer (Vercel Serverless Functions)

**Owns:** All DB access, transactional integrity, MD import parsing/validation, MD export, search index generation.

| Endpoint group | Responsibility |
|---|---|
| `/api/entities/{type}` | CRUD per entity type (PC, NPC, Scenario, Scene, Faction, Location, Item, Clue, Session, Bond) |
| `/api/relationships` | Create/delete typed edges; list reverse refs |
| `/api/import/scenario` | Receive MD, parse, validate, commit transactionally |
| `/api/export/entity/{id}` | Per-entity MD download |
| `/api/export/campaign` | Whole-campaign MD archive (ZIP stream) |
| `/api/search/index` | Returns denormalized {id, type, name, aliases} for client-side index |
| `/api/sessions/{id}/events` | Append event-tagging records during play mode |

### Data Store (Turso libSQL)

**Owns:** Persistence, FK integrity for typed entities, indexes for search and reverse-ref queries, daily backups (PITR).

## Integration Points

v1 has minimal integration surface — the PRD explicitly excludes auth, analytics, error reporting, and AI APIs.

| System | Direction | Pattern | Purpose | Discovery Required | Documentation |
|---|---|---|---|---|---|
| **Turso (libSQL)** | Outbound from API | libSQL client over HTTPS (auth token) | Primary data store; all reads/writes | Provision DB; copy URL + auth token to Vercel env | [Turso Docs](https://docs.turso.tech/), [Drizzle libSQL](https://orm.drizzle.team/docs/get-started-sqlite#turso) |
| **Vercel Platform** | Outbound (build/deploy), Inbound (HTTP) | Git integration; HTTPS | Hosting, serverless runtime, env vars, preview deploys | Link repo; configure env vars; one-time setup | [Vercel Docs](https://vercel.com/docs) |

No third-party integrations beyond hosting and DB. Browser is the only client.

## Runtime Scenarios

For each Must-Have functional requirement, the happy-path runtime interaction. Building blocks: `SPA`, `API` (Vercel Function), `DB` (Turso libSQL), `Domain` (pure-TS module).

### REQ-001 / REQ-002 / REQ-004 / REQ-005 / REQ-008 — Create a PC or NPC

1. SPA: GM opens character form; profession select fires `Domain.skillPackages.lookup(profession)` to pre-fill skills.
2. SPA: form submission validated by Zod schema (derived from Drizzle schema).
3. SPA → API (`POST /api/entities/pc`): payload over HTTPS.
4. API → DB: `INSERT` via Drizzle in a single transaction (PC + initial Bond/SAN structures).
5. API → SPA: returns persisted entity with id; TanStack Query invalidates the PC list.
6. **Decision points:** schema validation rejects malformed RAW fields before DB write; domain module is the single source of truth for skill-package math.

### REQ-003 / REQ-015 — Create a typed relationship and surface reverse refs

1. SPA: GM opens Clue detail, "Link to Faction" action.
2. SPA → API (`POST /api/relationships`): `{kind: 'clue→faction', source_id, target_id}`.
3. API → DB: validates kind against allowlist; inserts into polymorphic `relationships` table; returns success.
4. SPA: invalidates Faction detail query; on reload, Faction page issues `GET /api/entities/faction/{id}?include=incoming` and the Clue appears under "Implicating clues".
5. **Decision point:** kind allowlist is the integrity boundary in lieu of per-pair FKs.

### REQ-006 / REQ-007 — Apply Bond damage / SAN loss

1. SPA (play mode): GM clicks "Log SAN change" toolbar action; modal collects amount + source.
2. SPA: `Domain.sanity.applyLoss(pc, amount)` computes new current SAN and detects breaking-point crossing locally for instant feedback.
3. SPA → API (`POST /api/entities/pc/{id}/san-event`): persists the event and updated current SAN.
4. API → DB: appends to SAN change log; updates PC.current_san; if active session present, also stamps event onto Session via REQ-011 hook.
5. **Decision point:** breaking-point detection lives in `Domain.sanity` so it can be unit-tested in isolation.

### REQ-009 — Mark a clue delivered (play mode)

1. SPA (play mode): GM hits "Mark clue delivered"; modal asks for active Session and recipient PCs (defaults: current Session, all PCs).
2. SPA → API (`POST /api/clues/{id}/deliveries`): `{session_id, pc_ids[]}`.
3. API → DB: insert delivery record; insert event-tag rows for the Session (REQ-011 wiring).
4. API → SPA: success; SPA invalidates Clue and Session queries.
5. **Decision point:** delivery is append-only; un-delivering creates a corrective event rather than mutating history.

### REQ-010 / REQ-011 — Session with hybrid timeline + auto-derived report

1. SPA: opens Session detail page → `GET /api/sessions/{id}?include=events`.
2. API → DB: joins event-tag rows (clue deliveries, NPC encounters, SAN/Bond mutations stamped during the session) into a structured event log.
3. SPA: renders structured log + freeform notes editor; both saved separately.
4. **Decision point:** event-tagging is implicit during play mode — any in-play mutation that touches a session-scoped entity stamps the active session id automatically (Session id held in app-shell state).

### REQ-013 / REQ-N01 — Cmd-K palette under 1s on 1,000 entities

1. SPA cold start: `GET /api/search/index` returns a compact array `[{id, type, name, aliases}, …]`.
2. SPA: holds index in memory; on Cmd-K input, runs fuzzy match locally; renders matches synchronously.
3. SPA: on entity create/update, refreshes only the affected index slice (or full reload at <1s cost).
4. **Decision point:** server is the index source of truth; client is the search engine. No round-trip per keystroke.

### REQ-014 — List views with filtering

1. SPA → API (`GET /api/entities/{type}?filter=…`): server filters on indexed columns (faction_id, status, location_id, scenario_id).
2. API → DB: parameterized query returning filtered list.
3. SPA: TanStack Query caches per filter key; pagination only if a list outgrows reasonable defaults (deferred).

### REQ-016 — Bulk MD scenario import

1. SPA: GM uploads `.md` file to `/api/import/scenario`.
2. API: streams file, runs `Domain.mdImport.parse()` (validates schema, returns AST or detailed errors with line/field).
3. API: opens libSQL transaction; inserts Scenario, Scenes, NPCs, Clues, Items, Locations; inserts relationships; commits or rolls back atomically.
4. API → SPA: returns import summary or structured errors.
5. **Decision point:** parser and DB write are decoupled — parser is pure TS and unit-tested; DB write is a thin transactional wrapper.

### REQ-017 — Per-entity MD export

1. SPA: GM clicks "Download as Markdown" on entity detail.
2. SPA → API (`GET /api/export/entity/{type}/{id}`): returns deterministic MD via `Domain.mdExport.serialize(entity, outgoingEdges)`.
3. SPA: triggers browser download.

### REQ-019 / REQ-020 — Prep/play mode + primary actions

1. SPA: mode is a global state slice persisted in localStorage and reflected in URL query (`?mode=play`).
2. App shell renders a play-mode toolbar in play mode with five actions; each is a 1-key shortcut documented under `?` overlay.
3. **Decision point:** mode is purely client-side; the API is mode-agnostic.

### REQ-024 — Location surfacing

1. SPA: opens Location detail → `GET /api/entities/location/{id}?include=incoming,outgoing,sessions`.
2. API → DB: joins relationships + session-tag rows where `target = this location`.
3. SPA: renders panels for clues, NPCs at this location, items here, prior session events here.

### REQ-025 — Faction with status timeline + members + clues

1. SPA: opens Faction detail → `GET /api/entities/faction/{id}?include=members,implicating_clues,status_log`.
2. API → DB: joins NPCs where `faction_id = this`, clues via `relationships`, ordered status entries.
3. SPA: renders three panels.

### REQ-026 — Item ownership/location history

1. SPA: GM edits Item; changing owner or location triggers an append to `item_history` plus FK update.
2. API → DB: transactional update + history insert.

## Proposed Technology Stack

The PRD fixes most choices. This section documents them with rationale.

### Core Technologies

| Layer | Technology | Rationale |
|---|---|---|
| **Build / Dev** | Vite | PRD §3.3; matches user's other projects; fast HMR |
| **Frontend** | React 18 + TypeScript (strict) | PRD §3.3; REQ-N08 |
| **Styling** | Tailwind CSS | Best-judgment default; speed of iteration; consistent with workbench UI density |
| **Forms** | react-hook-form + Zod | Best-judgment default; Zod schemas can derive from Drizzle/TS types |
| **Server state** | TanStack Query | Best-judgment default; cache + invalidation match the entity-graph access pattern |
| **ORM / Migrations** | Drizzle | PRD §3.3; REQ-N10 |
| **Database** | Turso (libSQL — SQLite) | PRD §3.3; INT-001; free tier exceeds scale; supports FKs, full-text via FTS5 if ever needed |
| **Hosting** | Vercel | PRD §3.3; INT-002; REQ-N12 |
| **Backend runtime** | Vercel Serverless Functions (Node.js) | Co-located with frontend; free tier; only place credentials exist |
| **Testing** | Vitest + React Testing Library | REQ-N09 |
| **Linting/format** | ESLint + Prettier | REQ-N08 |
| **Git hooks** | Husky + lint-staged | REQ-N11 |
| **CI** | GitHub Actions | Free for personal; standard pattern |

### Infrastructure Platform

**Primary:** Vercel + Turso. Both free tiers are explicitly assumed sufficient (PRD A-2).

| Component | Service | Purpose |
|---|---|---|
| **Static hosting + functions** | Vercel | SPA serving, serverless API, preview deploys, env management |
| **Database** | Turso (libSQL) | Persistence, PITR backups |
| **Source control + CI** | GitHub + GitHub Actions | Version control; lint/typecheck/test gates |

**Alternative considered:** Cloudflare Pages + D1 — comparable free tier, but less mature Drizzle support for D1 vs. libSQL in 2026, and PRD pre-selected Turso. Not adopted.

### Development & Operations

| Category | Tool | Purpose |
|---|---|---|
| **CI/CD** | GitHub Actions + Vercel Git integration | Lint, typecheck, test on PR; auto-deploy on `main` |
| **Monitoring** | Vercel dashboard logs | Function invocation logs only; no APM in v1 |
| **Error tracking** | None in v1 | Explicitly deferred (PRD §5.3) |

## Environment Strategy

| Environment | Purpose | Infrastructure |
|---|---|---|
| **Local development** | Active development; runs Vite dev server against a personal Turso DB or local SQLite shim | Local Node.js + Vite; `.env.local` with Turso credentials |
| **Preview** | Per-branch Vercel preview deploys; serve as ad-hoc staging | Vercel preview URLs; same Turso DB or a "preview" branch DB if conflicts emerge |
| **Production** | Live application; hosts the user's actual campaign data | Vercel `main` branch deploy; production Turso DB with PITR |

No dedicated staging environment is provisioned — preview deploys cover that need at this scale.

## Security Architecture

### Security Layers

| Layer | Controls |
|---|---|
| **Network / transport** | Vercel-managed TLS for SPA + API; HTTPS-only |
| **Application access** | No interactive auth (REQ-N03); access is gated by deployment URL privacy and the fact that there is no credential disclosure path. Optional reinforcement: a single shared bearer token in env, checked by every `/api/*` function, with the SPA loading it from a server-rendered config. (Decided: defer until obvious need.) |
| **Credentials** | Turso URL + auth token only ever live in Vercel env vars; never in client bundle |
| **Data at rest** | Turso platform-managed encryption (default) |
| **Data in transit** | TLS 1.3 enforced by Vercel and Turso |
| **Source control** | `.env*` files git-ignored; secrets via Vercel + GitHub Actions secrets only |

### Compliance Considerations

| Requirement | Approach |
|---|---|
| Personal data / GDPR / etc. | N/A — single user is also the data subject; no third parties; no analytics |
| TTRPG content licensing | User-imported published scenarios are stored privately in user's own DB; no redistribution; no public surface |

## Scalability & Performance

| Scenario | Volume | Approach |
|---|---|---|
| **Normal use** | Single user; <10 reads + <5 writes per minute peak (during play) | Free-tier infra is overprovisioned by ~3 orders of magnitude |
| **Largest dataset** | One published campaign: a few hundred to ~1,000 entities | REQ-N01 sets the 1k-entity Cmd-K target; achieved via client-side index |
| **Burst** | None — single user has no fan-out | N/A |

### Scaling Strategy

- No horizontal scaling needed. Vercel Functions scale to zero/one as traffic warrants.
- Read performance is dominated by client-side index for search and TanStack Query cache for navigation.
- DB writes are infrequent and tiny; no sharding, replication, or read-replica strategy required at any plausible scale.

## Quality Requirements (from PRD §5.2)

| Quality attribute | Requirement | Architectural enabler |
|---|---|---|
| Performance — Cmd-K | <1s for 1,000 entities (REQ-N01) | Client-side denormalized index loaded once; in-memory fuzzy search |
| Performance — navigation | <500ms entity → entity (REQ-N02) | TanStack Query cache; co-located edge functions; minimal payloads |
| Reliability | MD export portability (REQ-N04) | Domain module owns deterministic serializer; export endpoint is a thin wrapper |
| Reliability | Daily backups (REQ-N05) | Turso PITR; one-time verification at setup |
| Maintainability | Strict TS + lint (REQ-N08) | `tsconfig.strict`, ESLint + Prettier in CI |
| Maintainability | Domain unit tests (REQ-N09) | Pure-TS `domain/` directory has no React/Drizzle imports |
| Maintainability | Schema migrations (REQ-N10) | Drizzle migrations checked into repo |
| Usability | Desktop browsers (REQ-N06) | Tailwind + standard React; no platform-specific APIs |
| Usability | Keyboard-first play mode (REQ-N07) | Hotkey layer in app shell; documented `?` overlay |

## Open Items for Discovery

| Item | Question | Impact |
|---|---|---|
| **MD scenario template format** | What is the precise YAML+MD shape that expresses Scenario + Scenes + NPCs + Clues + Items + Locations + edges without becoming awkward to author? | Validates PRD A-4; M2 acceptance gate; design against a real published scenario before deepening |
| **Polymorphic edge ergonomics in Drizzle** | Can the polymorphic `relationships` table be queried for reverse refs cleanly via Drizzle, or does it require raw SQL helpers? | M2.2A risk; spike during M1.1B per milestones risk register |
| **libSQL transaction semantics in Vercel Functions** | Confirm cold-start cost and transaction support for the import endpoint (REQ-016 must be atomic) | Blocks REQ-016 if not viable; mitigation is per-statement try/catch with manual rollback |
| **Deployment-URL privacy as auth model** | Is a single shared bearer token worth adding to `/api/*`, or is URL privacy enough? | Low risk; defer unless URL leaks become a real concern |
| **Skill-package data source** | Is the DG RAW skill-package table to be encoded as a TS constant, or imported from an external data file (JSON/YAML)? | Affects how easily NPC profession presets evolve; defer to M1.1C |

## Architecture Decisions (MADRs)

### ADR-001: Single Vercel-deployed project (no service split)

**Status:** Accepted
**Context:** A single-user GM tool with free-tier hosting and one developer.
**Decision:** Build one project — Vite + React SPA with co-located Vercel Serverless Functions for DB access — instead of splitting frontend and backend services.
**Consequences:** Simpler ops, simpler deployment, shared TS types across client/server. Trade-off: serverless functions are bound to Vercel; migration to a long-lived backend is non-trivial but unlikely needed at this scale.

### ADR-002: Polymorphic typed-edge table for relationships

**Status:** Accepted
**Context:** REQ-003 requires many relationship kinds and they will grow. Per-pair junction tables would require a migration per kind.
**Decision:** Use a single `relationships(kind, source_type, source_id, target_type, target_id)` table with an allowlist of `kind` values enforced at the application layer.
**Consequences:** Faster iteration; uniform reverse-ref query. Trade-off: no per-pair FK integrity at the DB layer; mitigated by app-level validation, kind allowlists, and integration tests.

### ADR-003: Client-side denormalized search index for Cmd-K

**Status:** Accepted
**Context:** REQ-N01 demands <1s Cmd-K results on 1,000 entities. A round-trip per keystroke cannot meet this consistently from edge functions.
**Decision:** Server exposes `/api/search/index` returning a compact list of `{id, type, name, aliases}`; SPA loads it once per session and runs in-memory fuzzy match.
**Consequences:** Sub-100ms response in practice; cold-start cost is one network round-trip. Trade-off: index becomes stale between mutations; refresh on every successful mutation.

### ADR-004: No interactive authentication in v1

**Status:** Accepted
**Context:** REQ-N03 — single-user app; interactive auth costs more than it earns at this scale.
**Decision:** Access is gated by deployment URL privacy and Vercel env-bound DB credentials. No login UI, no sessions, no tokens.
**Consequences:** Zero auth code to maintain. Trade-off: anyone with the URL can use the app; mitigated by URL secrecy and the absence of public links.

### ADR-005: Domain logic in pure-TS modules independent of React and Drizzle

**Status:** Accepted
**Context:** REQ-N09 mandates unit tests for char-gen math, SAN/Bond mutation, clue-delivery transitions, and MD parsing. Coupling these to UI or DB makes tests heavier and slower.
**Decision:** A `domain/` directory whose modules import neither React nor Drizzle; ORM and UI layers call into domain functions, never the reverse.
**Consequences:** Tests are pure functions over plain data; high coverage at low cost. Trade-off: occasional duplication between Zod schemas and Drizzle schemas; managed via codegen helpers.

### ADR-006: Vercel preview deploys serve as the staging environment

**Status:** Accepted
**Context:** Single developer, free tier, no team; a dedicated staging environment is overhead without obvious benefit.
**Decision:** Use per-branch Vercel preview deploys for staging-equivalent verification.
**Consequences:** No extra environment to maintain. Trade-off: previews share the production Turso DB unless explicitly pointed elsewhere; if the user wants destructive testing, they create a "preview" Turso branch DB at that moment.

## Technology Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Polymorphic edge table ergonomics in Drizzle** are awkward, slowing M2.2A | Medium | Medium | Spike in M1.1B; if blocked, fall back to per-pair junction tables before M2 starts (per milestones risk register) |
| **Vercel cold starts** push REQ-N02 (<500ms navigation) past target | Low | Medium | Co-locate functions; keep payloads small; warm via TanStack Query prefetching; if persistent, evaluate Vercel Edge Functions or a long-lived backend (post-v1) |
| **Turso free tier limits** (rows, requests, branches) hit during real campaign | Low | High | Tier limits >> single-user scale (PRD A-2); MD archive is offline disaster recovery (R-6) |
| **MD scenario template** ergonomically inadequate for real Arc Dream modules | Medium | High | First import of a real published scenario is the v1 acceptance gate; iterate template before deepening other features (PRD R-2) |
| **Serverless function transaction semantics** insufficient for atomic REQ-016 import | Low | High | Verify via spike during M2.2D; fallback: explicit BEGIN/COMMIT/ROLLBACK with libSQL client; further fallback: chunked import with idempotent retries |
| **No error tracking in v1** masks regressions | Medium | Low | Vercel function logs + browser console; user is sole user and sees errors directly; revisit post-v1 |
| **Drift in DG RAW correctness** as char-gen and mechanics evolve | Medium | Medium | Domain unit tests (REQ-N09); manual override always available (PRD R-4) |
| **Single point of failure for campaign data** (Turso outage/deletion) | Low | High | REQ-N04/REQ-017/REQ-018 ensure MD export is always available; user can git-mirror MD archive (PRD R-6) |
| **Vercel/Turso vendor lock-in** | Low | Low | Stack is portable: Vite SPA runs anywhere; libSQL is SQLite-compatible; Drizzle works against any libSQL/SQLite endpoint |

## Technical Glossary

| Term | Definition |
|---|---|
| **Polymorphic edge table** | A single `relationships` table whose rows reference any pair of entity types via `(source_type, source_id, target_type, target_id)`, instead of one junction table per relationship kind |
| **Reverse ref** | The inbound side of a typed relationship — e.g., a Faction's "Implicating clues" panel populated by querying relationships where `target_type='faction' AND target_id=this` |
| **Denormalized search index** | A compact array of `{id, type, name, aliases}` records served by a single endpoint and held in browser memory for in-memory fuzzy search (Cmd-K) |
| **Event tagging** | The implicit stamping of session-scoped mutations (clue deliveries, NPC encounters, SAN/Bond changes) onto the active Session id during play mode, used by REQ-011's auto-derived report |
| **Domain module** | A pure-TypeScript module under `domain/` that imports neither React nor Drizzle, holds DG-rules-faithful logic, and is unit-tested directly |
| **Active Session** | The Session id held in app-shell state during play mode and auto-stamped onto event-tag mutations |
| **Preview deploy** | A Vercel-generated per-branch URL that serves the staging-equivalent role in this project |
| **MD scenario template** | The documented YAML-front-matter + heading-scoped Markdown format consumed by REQ-016 to bulk-import a Scenario with all child entities and relationships |
| **PITR** | Point-in-Time Recovery — Turso's platform-managed backup mechanism used for REQ-N05 |
| **libSQL** | The SQLite-compatible engine and client library underlying Turso; used directly by Drizzle |

---

*Version 1.0 | April 2026 | Tech Spec Complete*

---

## Staffing
_Completed: 2026-04-30_

# Staffing Clarification Q&A

No clarifying questions were raised with the user (orchestrated mode, autonomous execution; `skip-steps: [6]` per execution context — Q&A and Human Review skipped). Staffing decisions derived from PRD content and prior architecture phases; assumptions logged below.

## Assumptions & Decisions Log

| # | Decision | Rationale | Impact |
|---|----------|-----------|--------|
| 1 | Single team member: Bartosz, sole developer, designer, PM, architect, and QA | PRD §3 "Personal project — sole user is also the sole developer"; no client, no stakeholders, no team | Single workstream; no allocation matrix across roles; no parallel execution map |
| 2 | Calendar measured in **weekends**, not weeks; 1 weekend = ~1 person-day of focused effort | PRD §3 "v1 scope ~4–6 weekends"; weekday work is incidental at best | Effort unit is **person-weekend** (PWE), not person-week; "calendar duration" is weekend count |
| 3 | Target: **6 weekends** for v1, with 4-weekend stretch goal if scope holds | PRD upper bound is 6; 4 is the optimistic floor. Plan to the upper bound; underrun is upside | Sets the calendar envelope; gates allocate against this |
| 4 | Allocation per weekend: assume **1.0 PWE per active weekend** (full Saturday + Sunday) | Solo personal project; the developer is fully allocated when actively working on it | Total v1 effort budget: ~6 PWE |
| 5 | Effort distribution by milestone roughly mirrors deliverable count weighted by AI leverage: M1 ~2 PWE, M2 ~2.5 PWE, M3 ~1.5 PWE | M1 has 14 deliverables but is mostly Heavy-leverage scaffolding/CRUD; M2 has 16 deliverables with mixed Heavy/Moderate (graph, mechanics, MD parser); M3 has 12 deliverables with Minimal-leverage manual run-through gating the schedule | Effort weighted toward M2 (highest design risk) and away from M1 (highest AI leverage) and M3 (smallest deliverable count, manual-bound items) |
| 6 | Development methodology: **Agentic** (not Hybrid or Traditional) | User is solo, AI-fluent, building greenfield TS/React app; AI agents generate scaffolding, schema, CRUD UI, MD parsers — exactly the bulk of the work | Justifies Heavy AI leverage rating across most deliverables; effort estimates assume agentic productivity |
| 7 | No external dependencies on calendar | No client IT, no design partners, no third-party vendors blocking | Calendar driven entirely by developer availability + sequential dependencies |
| 8 | Calendar can stretch but cannot compress below ~3 weekends | M3 includes a live-session run-through — a real campaign session must happen in real time; this is wall-clock-bound | Realistic floor: 3–4 weekends; realistic ceiling: 6–8 weekends if scope creep tolerated |
| 9 | No Q&A, no human review steps | Execution context: orchestrated mode, `qa: skip`, `skip-steps: [6]`; orchestrator owns sign-off | Plan generated autonomously; user reviews assembled `architecture.md` from orchestrator |
| 10 | Single-team project — parallel execution map omitted | Per Adaptation Guidelines "Single-team project: Omit parallel execution map" | Timeline section is condensed to weekend-by-milestone, not role-by-week |

---

# Staffing — Delta Green Campaign Manager

## Development Approach: Agentic Engineering

This project uses agentic development. The sole developer (Bartosz) operates with AI agents as core tooling — not as a supplement. AI agents generate code, tests, schema migrations, MD parsers, CRUD UI, and documentation; the developer focuses on architecture decisions, DG-rules-faithful judgment, integration logic, and quality validation.

The agentic advantage shows up as reduced total engineering effort (person-weekends), not a compressed calendar. The project's calendar is bounded by the developer's weekend availability and by one wall-clock-bound dependency: a live Delta Green campaign session must be run end-to-end through the tool as the v1 acceptance gate (PRD §6.2).

## Team Structure

### Single-Member Team

| Team Member | Roles | Allocation | Tech Stack |
|---|---|---|---|
| **Bartosz** | Architect, designer, agentic engineer, QA, PM, end user | 100% on active weekends; 0% otherwise | Vite, React 18, TypeScript (strict), Tailwind, TanStack Query, react-hook-form + Zod, Drizzle ORM, libSQL/Turso, Vercel Functions, Vitest, AI-assisted dev |

No shared resources. No external roles. No client.

## Timeline & Allocation

### Calendar (Weekend-Indexed)

| Milestone | Weekends | Duration | Engineering Intensity | Deliverable Groups |
|---|---|---|---|---|
| **M1: Foundation** | 1–2 | 2 weekends | High (mostly Heavy-leverage scaffolding) | 1A, 1B, 1C |
| **M2: Core Workbench** | 3–5 | 3 weekends | Peak (mixed Heavy + Moderate, highest design risk) | 2A, 2B, 2C, 2D |
| **M3: Campaign-Run-Ready** | 6 | 1 weekend (+ live-session run-through within the same window) | Tapering (manual run-through gates progress) | 3A, 3B, 3C |
| **Total** |  | **6 weekends** |  | **10 groups, 42 deliverables** |

> **Floor / ceiling:** Optimistic floor is 4 weekends (M1=1, M2=2, M3=1) if AI leverage holds and no rework. Pessimistic ceiling is 8 weekends (M1=2, M2=4, M3=2) if MD scenario template ergonomics or polymorphic-edge query plumbing forces redesign. Plan target: **6 weekends**.

### Effort Distribution by Milestone

| Milestone | Effort (PWE) | % of Total | Why |
|---|---|---|---|
| **M1: Foundation** | ~2.0 | 33% | 14 deliverables but mostly Heavy AI leverage (scaffolding, Drizzle setup, generic CRUD, schema-driven forms); the bulk of the work is agent-generated |
| **M2: Core Workbench** | ~2.5 | 42% | 16 deliverables, highest design risk: polymorphic edges, MD scenario template, transactional import, DG mechanics judgment, Cmd-K performance tuning. Moderate-leverage work dominates |
| **M3: Campaign-Run-Ready** | ~1.5 | 25% | 12 deliverables, but 3C is Minimal-leverage (manual cross-browser pass, Turso PITR verification, **live campaign session**). Wall-clock-bound, not effort-bound |
| **Total** | **~6.0 PWE** | 100% |  |

### Allocation Across the 6-Weekend Calendar

| Weekend | Milestone | Focus | Effort |
|---|---|---|---|
| **W1** | M1 | 1A scaffolding (Vite + lint/format/test + CI + Vercel deploy); 1B Turso provision + Drizzle setup + initial schema | ~1.0 PWE |
| **W2** | M1 | 1C: generic CRUD layer + entity routing + PC/NPC/Faction/Location/Item editors + skill-package presets | ~1.0 PWE |
| **W3** | M2 | 2A: polymorphic relationships table + Clue entity + reverse-ref surfacing + domain edge tests; 2B: Bond + SAN entities/services | ~1.0 PWE |
| **W4** | M2 | 2C: Session entity + hybrid timeline; 2D start: MD scenario template spec + first import of a real published scenario (PRD A-4 validation) | ~1.0 PWE |
| **W5** | M2 | 2D finish: bulk MD importer + per-entity MD export + Cmd-K palette + list views with filtering; M2 DoD pass | ~0.5 PWE |
| **W6** | M3 | 3A: prep/play mode split + play-mode toolbar + clue delivery flow + keyboard shortcuts; 3B: event tagging + auto-derived session report + handout export + campaign archive export; 3C: live-session run-through against an imported scenario; bug fixes | ~1.5 PWE |
|  |  | **Total** | **~6.0 PWE** |

Allocation note: W5 dips to ~0.5 PWE because by then M2 is mostly composition of M2 primitives, not new mechanics — agent leverage is at its peak. W6 spikes to ~1.5 PWE because the live-session run-through is wall-clock-bound and surfaces fix-it work that must be addressed in the same window.

### Effort Summary by Role

Single-member team — all roles are Bartosz; the table is degenerate but preserved for traceability.

| Role | Allocation | Weekends on Project | Person-Weekends |
|---|---|---|---|
| **Architect** | absorbed into engineer time | 6 | (included below) |
| **Agentic Engineer** | full | 6 | ~5.5 |
| **PM / QA / Designer** | absorbed into engineer time | 6 | ~0.5 |
| **Total** |  |  | **~6.0 PWE** |

## Milestone Estimates

### M1: Foundation (W1–W2, ~2.0 PWE)

| Deliverable Group | Bottleneck | Primary Owner |
|---|---|---|
| 1A Repo scaffolding + CI + Vercel deploy | Agent-generated; bottleneck is Vercel + GitHub auth setup | Bartosz |
| 1B Data layer (Turso + Drizzle + initial schema) | Drizzle/libSQL ergonomics for polymorphic-edge spike | Bartosz |
| 1C Entity CRUD + char form | DG RAW PC field-set correctness + skill-package data sourcing | Bartosz |
| **Phase effort: ~2.0 PWE** |  |  |

**Critical path:** 1A → 1B → 1C; strictly serial. The polymorphic-edge schema spike (per milestones risk register R-3) happens in 1B; if the spike fails, fall back to per-pair junction tables before W3 begins.

### M2: Core Workbench (W3–W5, ~2.5 PWE)

| Deliverable Group | Bottleneck | Primary Owner |
|---|---|---|
| 2A Investigation graph (polymorphic edges + Clue + reverse-refs) | Drizzle reverse-ref query ergonomics | Bartosz |
| 2B DG mechanics (Bond + SAN) | DG-rules-faithful judgment on breaking-point logic | Bartosz |
| 2C Sessions + hybrid timeline | None; mostly straight CRUD + ordering UI | Bartosz |
| 2D Import/Export/Cmd-K | **MD scenario template ergonomics against a real Arc Dream module** (PRD R-2) | Bartosz |
| **Phase effort: ~2.5 PWE** |  |  |

**Critical path:** 2A → 2D (import depends on edges); 2B and 2C are independent of 2A and run in parallel within the same weekend allocations. The MD scenario template is the single biggest design risk in v1; W4 begins the import spike against a real published scenario before continuing.

### M3: Campaign-Run-Ready (W6, ~1.5 PWE)

| Deliverable Group | Bottleneck | Primary Owner |
|---|---|---|
| 3A Mode split + play-mode toolbar + clue delivery flow + keyboard shortcuts | Ergonomics tuning; Minimal-leverage in places | Bartosz |
| 3B Event tagging + auto-derived session report + handout export + campaign archive | Event-tag stamping logic correctness across all five mutation types | Bartosz |
| 3C Cross-browser pass + Turso PITR verification + **live-session run-through** + bug fixes | **Live campaign session — wall-clock-bound** | Bartosz |
| **Phase effort: ~1.5 PWE** |  |  |

**Critical path:** 3A → 3B → 3C; the run-through is the v1 acceptance gate (PRD §6.2). Bug fixes from the run-through are absorbed in the same weekend window; if rework exceeds capacity, slip to W7 rather than ship without fixes.

## Notes

### Team Prerequisites

- Full-stack proficiency across Vite, React, TypeScript (strict), Drizzle, libSQL, Vercel (already met by sole developer)
- Agentic development proficiency is required, not optional — the calendar assumes Heavy AI leverage on scaffolding/CRUD
- Familiarity with Delta Green RAW (Need to Know, Handler's Guide) for char-gen, SAN, and Bond mechanics judgment

### External Dependencies

| Dependency | Owner | Risk | Mitigation |
|---|---|---|---|
| Turso free-tier provisioning | Bartosz / Turso platform | Low | One-time setup in W1; free tier overprovisioned by orders of magnitude (PRD A-2) |
| Vercel free-tier hosting | Bartosz / Vercel platform | Low | One-time setup in W1; preview deploys serve as staging |
| Published Arc Dream scenario for MD-import validation (W4) | Bartosz | Low | Already owned; PRD §6.2 names this as the validation gate |
| Real campaign session for v1 acceptance (W6) | Bartosz + players | Medium | Players must be available the W6 weekend; if delayed, W6 slips to next weekend the group meets |

### Buffer Rationale

- Calendar plans to the PRD upper bound (6 weekends), not the lower bound (4 weekends). The 4-weekend floor is upside, not the target.
- W5 is intentionally light (~0.5 PWE) to absorb spillover from W3–W4 if M2 design work runs long, especially the MD scenario template iteration.
- W6 is intentionally heavy (~1.5 PWE) to absorb fix-it work surfaced by the live-session run-through.
- If polymorphic-edge schema fails the W1 spike, the calendar absorbs it by falling back to per-pair junction tables before W3 — this trades flexibility for schedule certainty (per milestones R-3).

### Communication & Quality

- No team — communication overhead is zero
- Code review: self-review via PR; CI gates (lint + typecheck + Vitest) enforce quality on every push (REQ-N08, REQ-N09, REQ-N11)
- Architecture decisions logged inline as MADRs in `architecture.md` Appendix C
- Self-acceptance: each milestone's DoD checklist (per milestones doc) is the gate
- v1 launch gate: live session run end-to-end through the tool against an imported published scenario — the only external validation

### Parallel Execution Map

Omitted — single-team project per Adaptation Guidelines.

---

*Version 1.0 | April 2026 | Staffing Complete*

---

## Architecture Validation
_Completed: 2026-04-30_

### Validation Report

```
Architecture Validation Report
──────────────────────────────
Sections checked: 12 Arc42 + 4 Appendices
REQ-IDs verified: 41 from PRD §8.3 (26 functional + 12 non-functional + 2 integration + 9 won't, of which Could/Won't intentionally excluded from Appendix C per matrix's stated scope)
Stories verified: 25 across M1/M2/M3
Blockers: 0
Warnings: 0
Info: 4
```

### Findings Table

| # | Check | Severity | Item | Issue | Resolution |
|---|-------|----------|------|-------|------------|
| 1 | Requirements Traceability — Appendix C coverage | Info | REQ-021, REQ-022, REQ-023 (Could/Won't) | Not present in Appendix C traceability matrix | Intentional per matrix's closing note: "Could-Have REQs and Won't-Have REQ-023 are explicitly deferred to post-v1 and intentionally excluded from this matrix." Acceptable. |
| 2 | Requirements Traceability — Must-Have story mapping | Info | All Must-Haves | Every Must-Have REQ-ID maps to at least one story; every Should-Have maps as well | No action; passes. |
| 3 | Arc42 Structural Completeness — §6 Runtime View coverage | Info | REQ-012, REQ-014, REQ-018, REQ-026 | Not given dedicated runtime scenarios in §6 | REQ-014 (list filtering) and REQ-026 (Item) are covered by the generic CRUD pattern established in the entity-creation scenario; REQ-012 (handout export) and REQ-018 (campaign archive) are Should-priority and follow the per-entity export pattern already covered. No correctness gap; flagged as documentation completeness only. |
| 4 | Arc42 Structural Completeness — all 12 sections | Info | §1–§12 | All present with substantive content | Passes. |
| 5 | ADR Consistency | Info | ADR-001..006 | Sequential numbering; every ADR has Decision Outcome and references REQ-IDs or quality goals | Passes. |
| 6 | Internal Consistency — Tech stack | Info | §4 Solution Strategy ↔ §8.1 Tech Stack | All technologies referenced in §4 (Vite, React, TS, Tailwind, Drizzle, Turso, Vercel Functions, Vitest, react-hotkeys-hook) appear in §8.1 | Passes. |
| 7 | Internal Consistency — Build order vs dependencies | Info | §5.2 Build Order ↔ §5.4 Dependency Matrix | M1 → M2 → M3 ordering respects all dependency edges in the Mermaid graph | Passes. |
| 8 | Mermaid syntax | Info | §5.4 dependency matrix | `graph TD` block parses correctly with valid node/edge syntax | Passes. |
| 9 | Gherkin syntax | Info | All Appendix A stories | Given/When/Then blocks well-formed; multi-clause use `And`/`But` correctly | Passes. |

### Auto-Fixes Applied

None. No issues required automated correction.

### Assumptions Logged (Unresolvable Items)

None. All Info-level findings reflect intentional design decisions documented within the architecture itself (e.g., explicit exclusion of Could/Won't REQs from the traceability matrix). No blockers prevent finalization.

### Summary

9 checks run. 0 blockers resolved. 0 warnings addressed. 0 auto-fixes applied. 41 REQ-IDs fully traced (all Must-Have and Should-Have requirements map to stories and units; Could-Have and Won't-Have REQ-IDs intentionally excluded from the v1 traceability matrix per its stated scope). Architecture document is ready for finalization and downstream consumption by `/ignite:kickoff`.

---

*Version 1.0 | April 2026 | Architecture Validation Complete*
