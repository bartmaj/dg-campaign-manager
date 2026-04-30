# AUDIT — Ideate Pipeline Q&A Record

> Debug artifact. Records source inventory and all clarifying Q&A from the ideate pipeline run.

---

## Discovery
_Completed: 2026-04-30_

### Source Inventory

| File | Classification | Key Content |
|------|---------------|-------------|
| _(synthesized)_ | Discovery Q&A | Structured Q&A covering project context, problem space, users, scenario/clue model, NPC depth, MVP scope, success criteria, out-of-scope, tech stack, data layer |
| Command invocation | Stakeholder description | Initial user description of desired campaign manager features |

### Q&A Log

#### Project Context

| # | Question | Answer | Follow-up |
|---|----------|--------|-----------|
| 1 | Solo personal tool vs. multi-user? | Solo personal tool only | Local-first design, no auth/multi-tenancy |
| 2 | Player access model? | GM-only, no player access | No player UI; exports may come later |
| 3 | Deployment model? | Cloud-hosted (Vercel/Netlify + DB) | Web app, accessible from anywhere |
| 4 | Delta Green ruleset edition? | DG: The Role-Playing Game (Arc Dream, 2016+) | Standalone modern d100 edition |
| 5 | Current state / pain point? | Nothing organized yet — starting fresh | Wants the right tool from day one of next campaign |

#### Domain Model

| # | Question | Answer | Follow-up |
|---|----------|--------|-----------|
| 6 | What does "links between scenarios" mean? | Scenarios contain scenes/locations connected via NPCs, items, or clues. Shared entities create emergent scenario links. Sequential association is natural but not required. | Graph-shaped data model; entities are the connectors, not scenarios themselves |
| 7 | What do you most want from clue tracking? | All four: provenance to scenarios, clue-to-clue web, clue-to-NPC/faction/location refs, delivery-to-players tracking | Investigation graph is core; clues have rich relationships |
| 8 | Character generator fidelity? | Full DG RAW char gen | By-the-book stats, professions, skill packages, bonds, motivations |
| 9 | Calendar semantics? | In-game timeline + real session metadata | Primary view = in-game timeline; real sessions tagged onto it |
| 10 | Session reports — what to capture? | All: structured event log, player handouts, auto-derived from entity changes, free-form GM notes | Reports partially write themselves from session activity |
| 11 | NPC details beyond stats? | All: RP hooks, faction/affiliation, relationship web, status/state | Rich NPC modeling required |

#### Scope & Success

| # | Question | Answer | Follow-up |
|---|----------|--------|-----------|
| 12 | MVP slice (4-6 weekends)? | PCs + NPCs + character generator | Roster + char gen first; narrative tooling iterated after |
| 13 | Success criteria? | (a) run a full DG campaign without falling back to other tools, (b) prep time drops noticeably, (c) "what do players know about X?" answerable fast, (d) fun to build / craft project | Self-sufficiency, speed, retrieval, hackability |
| 14 | Explicit out-of-scope? | Dice rolling / VTT play features; multi-system support; mobile-first; AI/LLM features | DG-only, desktop-first, no AI assist, prep tool not a play surface |

#### Technical

| # | Question | Answer | Follow-up |
|---|----------|--------|-----------|
| 15 | Tech stack? | React + TypeScript + Vite | Matches existing personal projects |
| 16 | Data persistence? | SQLite via Turso + Drizzle | Best fit for graph-shaped data at single-user scale; serverless-friendly; ample free tier |

### Synthesized Discovery

# Discovery: Delta Green Campaign Manager

> Synthetic source document produced through structured discovery Q&A.
> This document serves as the primary input for the prd pipeline
> when no stakeholder transcripts or research documents are available.

## Project Context

**Project name:** Delta Green Campaign Manager (`dg-campaign-manager`)

**Owner / sole user:** Bartosz (the developer is also the only user — single GM building a tool for their own use).

**Type:** New product, personal craft project. No client, no business stakeholders, no team — built by and for one person.

**Domain:** Tabletop roleplaying game (TTRPG) Game Master tooling for *Delta Green: The Role-Playing Game* (Arc Dream Publishing, 2016+) — the standalone modern edition of the Cthulhu-mythos federal-conspiracy horror RPG (d100 system, derived from Call of Cthulhu).

**What prompted it:** The user is about to start a new Delta Green campaign and has nothing organized yet. They want the right tool from day one rather than scrambling with scattered notes mid-campaign.

## Problem Space

GM prep and between-session organization for a Delta Green campaign is information-dense and graph-shaped:
- Scenarios contain scenes and locations.
- Scenes contain NPCs, items, and clues.
- Clues point to other clues, NPCs, factions, or locations — forming an investigation web.
- Across scenarios, shared entities (a recurring NPC, a recovered artifact, a clue thread) create emergent narrative links and meta-plot continuity.
- Each session changes the state of the world: which clues were delivered, which NPCs were encountered, what players currently know.

Off-the-shelf tools fall short:
- Generic note tools (Obsidian, Notion) lack structured entity types and referential integrity.
- VTTs (Roll20, Foundry) are play surfaces, not prep/organization surfaces.
- Spreadsheets capture data but not graph relationships.

The single most important capability is fast retrieval: "what do players currently know about X?" must be answerable in seconds, not by re-reading session notes.

## Target Users & Stakeholders

**Primary (and only) user:** the GM (Bartosz) — running Delta Green campaigns solo.

**Stakeholder considerations:** none. No players see the tool, no team uses it, no client validates it. The user's own running of campaigns is both the build target and the validation channel.

## Competitive Landscape

To be expanded in Wave 1 (competitive analysis). Initial signals:
- General-purpose tools: Obsidian, Notion, World Anvil, Kanka, Legend Keeper.
- VTTs (excluded as direct competitors — different surface): Roll20, Foundry VTT.
- DG-specific tools: a few community character sheets and generators, but no full campaign-management product known to the user.

The differentiation hypothesis is **DG-native data model + graph-first design** — typed entities (Scenario, Scene, NPC, Clue, Faction, Item, Session, PC) with first-class relationships, rather than a generic page/wiki structure.

## Technical Constraints

- **Frontend:** React + TypeScript + Vite (consistent with the user's other personal projects in `/personal/`).
- **Data:** SQLite via Turso (libSQL) with Drizzle ORM — serverless-friendly, relational with FK integrity, ample free tier.
- **Deployment:** Cloud-hosted (Vercel/Netlify-class platform).
- **Auth:** None required (single user; Turso URL + auth token in env is sufficient).
- **Scale:** Single-user, single-campaign-at-a-time mental model (though multiple campaigns may coexist in the data). Hundreds-to-low-thousands of entities lifetime — well below any platform limits.
- **No mobile-first requirement.**

## Business Goals & Success Metrics

This is a personal project; "business" goals are personal effectiveness goals.

**Primary success criteria:**
1. **Self-sufficiency:** the user runs a full Delta Green campaign through this tool without falling back to external notes, spreadsheets, or other tools.
2. **Prep speed:** session prep time drops noticeably compared to ad-hoc notes.
3. **Retrieval speed:** the question "what do the players know about X?" (where X is any entity) is answerable in under ~10 seconds.
4. **Craft satisfaction:** the build is enjoyable; the codebase is hackable.

**Timeline:** target a usable v1 in roughly 4–6 weekends of work. No hard deadline.

**Budget:** free-tier infra only (Turso + Vercel/Netlify). Personal time investment.

## Key Requirements (Initial)

**Must-have (v1 / MVP):**
- PC management (full DG RAW character sheets).
- NPC management (stats + RP hooks + faction + relationship web + status).
- Character generator (PC and NPC, RAW-faithful for PCs; templates acceptable for NPCs).

**Should-have (v1.x):**
- Scenario authoring with scenes/locations.
- Clue authoring with provenance, clue-to-clue links, clue-to-entity links, and player-delivery tracking.
- Session log with in-game timeline and real-session metadata.
- Session reports combining structured event log + free-form GM notes + auto-derived entity changes + exportable player handouts.

**Could-have:**
- Cross-campaign entity reuse.
- Search across all entities.
- Visualization of the investigation graph.
- Markdown export of any entity / report.

**Explicitly out of scope (v1 and beyond unless reconsidered):**
- Dice rolling, combat tracking, or any VTT/play-surface features.
- Multi-system support (Call of Cthulhu, other RPGs).
- AI/LLM-assisted generation or summarization.
- Mobile-first or mobile-optimized UI (desktop is the primary surface).
- Multi-user features, accounts, sharing, real-time collaboration.
- Player-facing UI (read-only or edit) inside the app.

## Open Questions

- Exact taxonomy and required fields for each entity type — to be settled in Wave 2 (requirements) and downstream functional design.
- Whether scenes are first-class entities or properties of scenarios — leaning first-class given the graph model.
- Whether the investigation graph should have an explicit visual editor in v1 or only emerge from cross-references.
- How "what players know" is modeled — per-clue delivery flags vs. per-session deltas vs. a knowledge-state snapshot.
- Authoring vs. running modes — whether the UI distinguishes between prep and at-the-table use.

---

## Competitors
_Completed: 2026-04-30_

### Q&A Log

| # | Question | Options | Answer | Follow-up |
|---|----------|---------|--------|-----------|
| 1 | Have you used any of these campaign tools before? | Kanka / World Anvil / Legend Keeper et al / Obsidian or Notion | Obsidian / Notion only | Direct incumbents to displace are general note tools, not RPG-native tools |
| 2 | How should Foundry VTT be treated? | Exclude / include adjacent / include due to DG modules | Exclude — play surface, not prep tool | Foundry not in competitive analysis |
| 3 | Where should differentiation live? | DG-native / graph-first / clue-tracking / workflow speed | All four; clue-tracking specifically called out | Clue/investigation graph is the unique market gap |

### Findings Summary

- The competitive landscape splits into three camps: generic-substrate tools (Obsidian, Notion), RPG-native generic tools (Kanka, World Anvil, Legend Keeper), and DG-specific char-gen tools (community sheets/generators).
- **No Delta Green-native campaign tool exists.** The intersection of DG-rules-faithful char gen and full campaign management is an empty cell in the matrix.
- **Investigation graph is universally weak** across all surveyed tools — clue/evidence relationships reduce to prose with hand-maintained backlinks everywhere.
- **The user's own Obsidian/Notion habit is the primary "competition"** — the most realistic failure mode is the user falling back to scattered notes.
- Differentiation strategy: lead with typed DG-native entities and first-class typed relationships from day one; do not compete on generic note-taking breadth.

### PRD Sections Populated

- 1.0 Document Overview (scaffold + project metadata)
- 2.0 Executive Summary (initial)
- 3.0 Background & Strategic Fit (3.3 constraints, 3.5 competitive landscape)
- 5.4 Out of Scope (initial — refined by requirements)

---

## Knowledge
_Completed: 2026-04-30_

### Q&A Log

| # | Question | Answer | Follow-up |
|---|----------|--------|-----------|
| 1 | Most painful prep step? | Keeping NPCs consistent; reconstructing player knowledge; tracking clue web | All three concentrate around persistent state across sessions |
| 2 | At-table retrieval scrambles? | NPC stat/RP hooks; finding clues; **information at a given location** (user-added) | Locations are first-class; queries by location matter |
| 3 | DG mechanics needing first-class support (vs. freeform text)? | Bonds (with damage), Sanity (current/max, breaking points, disorders) | Skill packages and Home Scenes can be generic for v1 |
| 4 | What's most likely to "get lost between sessions"? | All four: NPC voices, clue threads, faction/conspiracy state, PC backstory hooks | Tool's primary job is persistent memory, not authoring |

### Findings Summary

- The tool's primary job is **persistent memory across sessions**, not scenario authoring. Authoring is secondary; recall and continuity are primary.
- **Locations** join Scenarios, NPCs, Clues, Items, Factions, Sessions, PCs as a first-class entity type — the user explicitly added "information in a given location" to the at-table retrieval list.
- **Bonds and Sanity** are the two DG mechanics needing structured support in v1. Skill packages and Home Scenes can be deferred to freeform for now.
- **All four cross-session loss risks** were selected (NPC voices, clue threads, faction state, PC backstory hooks) — strong signal that the entity model must capture nuance, not just facts.
- The user's Obsidian/Notion fallback is the single biggest competitive risk; every pain point is something Obsidian/Notion handles only as freeform prose.

### PRD Sections Populated

- 3.1 Problem Statement (operational reality + unwritten constraints)
- 3.4 Pain Points with Existing Systems (prep / at-the-table / cross-session loss / DG-mechanic-specific)

---

## Opportunity
_Completed: 2026-04-30_

### Q&A Log

| # | Question | Answer | Follow-up |
|---|----------|--------|-----------|
| 1 | "Why now" / campaign shape anchoring v1? | Pre-built scenario / module campaign (e.g. *Impossible Landscapes*-class) | v1 must support running published material; data-entry ergonomics for transcribing modules is a first-class concern |
| 2 | Product identity framing? | A GM workbench | Opinionated single-purpose UX, prep + at-table; not a generic database or wiki |

### Findings Summary

- **Strategic positioning:** opinionated DG GM workbench, anchored on running published Arc Dream campaigns as v1's reference workflow.
- **Three intersecting gaps form the opportunity:** DG-native data model + char gen, typed investigation graph with delivery tracking, persistent campaign memory across sessions. No competitor covers any one of these properly; nothing covers all three.
- **Key risks:** scope creep, data-entry burden for published modules, fallback to Obsidian, char gen complexity, undisciplined timeline.
- **Risk mitigation:** narrow MVP slice, treat data-entry UX as first-class, time-box to weekends and cut features rather than extending.
- The workbench framing is itself a forcing function: every feature must demonstrably make the GM faster at prep or at-table lookup, or it's not a workbench feature.

### PRD Sections Populated

- 3.2 Goal & Opportunity (why-now, strategic opportunity, value prop, risks, key takeaway)
- 2.0 Executive Summary (refined with workbench framing, v1 anchored on published campaign use case)

---

## Requirements
_Completed: 2026-04-30_

### Prioritization

MoSCoW priorities derived directly from the discovery answers (MVP slice = PCs + NPCs + char gen) and refined through verification Q&A below.

| Bucket | Count | Notes |
|--------|------:|-------|
| Must | 31 | Core MVP + supporting infra (entity model, char form, sessions, retrieval, ingest/export, modes, tech baseline) |
| Should | 4 | Player handout export, archive export, daily DB backup, keyboard-first play mode |
| Could | 2 | Char-gen wizard, investigation graph viz |
| Won't (v1) | 9 | Out-of-scope items + deferred Could items tracked but excluded from v1 |

### Verification

#### Data model & scope

| # | Question | Answer | Impact |
|---|----------|--------|--------|
| 1 | Scene as first-class entity, child of Scenario, or hybrid? | Hybrid — nestable like a Notion sub-page (own URL, lives under Scenario) | REQ-002 |
| 2 | Multi-campaign support in v1? | Single campaign only | REQ-023 deferred to "Won't, v1"; campaign is implicit at DB level |
| 3 | Char-gen automation level for v1? | Form with skill-package presets + manual override; wizard added later | REQ-008 (Must), REQ-021 (Could) |
| 4 | Investigation graph visualization priority? | Could-have / nice-to-have | REQ-022 (Could); list-view-driven retrieval is the v1 path |

#### Features & operations

| # | Question | Answer | Impact |
|---|----------|--------|--------|
| 5 | Auto-derived session reports — priority and approach? | Must-have v1, full auto-derive (tagged entity activity populates report) | REQ-011 (Must) |
| 6 | Global search/retrieval level for v1? | Cmd-K palette across all entity types | REQ-013 (Must); informs REQ-N01 latency target |
| 7 | Backup strategy? | Read-only Markdown export per entity | REQ-017 (Must), REQ-018 (Should), REQ-N04 (Must); SQLite is canonical store, MD is portable archive |
| 8 | Data entry approach for published modules? | Bulk import from a structured Markdown template | REQ-016 (Must); meaningful build (parser, schema, validation) — directly mitigates "data-entry burden" risk from opportunity phase |

#### Final clarifications

| # | Question | Answer | Impact |
|---|----------|--------|--------|
| 9 | Char-gen treatment for PC vs NPC? | Same form-with-presets for both | REQ-008 |
| 10 | Authoring vs at-table — same UI or distinct modes? | Distinct prep and play modes | REQ-019, REQ-020 (both Must) — material UX commitment |
| 11 | Hosting platform? | Vercel | REQ-N12, INT-002 |
| 12 | Codebase status? | Confirmed greenfield, nothing in place | REQ-N11 — foundational scaffold story is required for `/ignite:kickoff` |

### Codebase & Tooling

- **Project type:** Greenfield (new codebase from scratch).
- **VCS access:** N/A — local repo `/Users/bartosz/projects/personal/dg-campaign-manager`; user will create GitHub remote at their discretion.
- **Existing tooling:** None.
- **Foundational story required:** **Yes — full scaffold.** ESLint, Prettier, TS strict, Vitest, Drizzle, libSQL client, Vercel deploy config, git hooks, README. This is REQ-N11.

### PRD Sections Populated

- 5.1 Functional Requirements (REQ-001 through REQ-026; 23 Must, 2 Should, 2 Could, 1 Won't (v1))
- 5.2 Non-Functional Requirements (REQ-N01 through REQ-N12; organized by ISO 29148 quality attributes)
- 5.3 Key Integrations (INT-001 Turso, INT-002 Vercel)
- 5.4 Out of Scope (REQ-W01 through REQ-W09 with rationale and future-consideration notes)
- 8.3 Requirements Traceability (full REQ-ID index, 49 entries)

### Unresolved items / open questions

- Exact MD scenario template schema (REQ-016) — to be settled in functional design / architecture phase.
- Campaign data model details (Scene/Scenario tree, Bond schema, SAN log shape) — Must requirements give the contract; field-level shape is downstream.
- Whether play mode fully replaces prep mode UI or layers on top — UX design concern, not a requirements concern.

---

## Requirements Validation
_Completed: 2026-04-30_

| # | Check | Severity | REQ-ID | Issue | Resolution |
|---|-------|----------|--------|-------|------------|
| 1 | Completeness — acceptance criteria | Warning | REQ-021 | Could-have item lacked acceptance criteria | Auto-fixed: added one-line G/W/T |
| 2 | Completeness — acceptance criteria | Warning | REQ-022 | Could-have item lacked acceptance criteria | Auto-fixed: added one-line G/W/T |
| 3 | Completeness — acceptance criteria | Warning | REQ-023 | Won't-have item lacked acceptance criteria | Auto-fixed: added one-line forward-looking acceptance |
| 4 | Consistency — REQ-ID naming | Info | (multiple) | Systematic prefixes used (`REQ-NNN`, `REQ-NNN`, `REQ-WNN`, `INT-NNN`) instead of strict `REQ-NNN` | Accepted as intentional convention; internally consistent; aids readability |
| 5 | Clarity — measurement softness | Info | REQ-N02 | "Typical broadband connection" is qualitative | Accepted; the 500ms target is the binding constraint |
| 6 | Traceability — explicit source refs | Info | (all) | Sources are the synthesized discovery + Wave 1 audit entries, referenced collectively rather than per-REQ | Accepted; appropriate for a synthetic-source project |
| 7 | Traceability — Must-Have ↔ persona | Info | (all Must-Have functional) | §4.0 personas not yet populated | By-design: prd-verify (Wave 3) populates §4.0 next |
| 8 | Consistency — Must vs Won't | OK | — | Cross-checked all Must-Have items against §5.4 Won't-Have list | No contradictions found |
| 9 | Consistency — duplicate REQ-IDs | OK | — | Scanned §8.3 (49 entries) | All unique |
| 10 | Consistency — MoSCoW priority | OK | — | Every requirement in §5.1 and §5.2 has explicit priority | — |
| 11 | Consistency — orphan REQ-IDs | OK | — | Cross-referenced §8.3 ↔ §5.x | All entries match in both directions |
| 12 | Completeness — NFR quality attributes | OK | — | Six attributes addressed (Performance, Security, Reliability, Usability, Maintainability, Hosting) — exceeds the minimum of 2 | — |
| 13 | Completeness — Won't rationale | OK | — | All §5.4 entries have rationale + future-consideration | — |

**Summary:** 49 requirements checked. 0 blockers. 3 warnings (all auto-fixed in PRD). 4 info items (accepted as intentional or by-design ordering).
