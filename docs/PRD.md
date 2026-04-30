2026-04-30

Ideate Phase
Product Requirements Document
Bartosz (personal project)

**Product Requirements Document: Delta Green Campaign Manager**

## 1.0 Document Overview

| Field                          | Value                                                |
| :----------------------------- | :--------------------------------------------------- |
| **Version**                    | 1.0                                                  |
| **Date**                       | 2026-04-30                                           |
| **Status**                     | Complete                                             |
| **Target Release / Milestone** | v1 MVP in ~4–6 weekends                              |
| **Authors / Contributors**     | Bartosz (sole author and sole user)                  |

This document is the Product Requirements Document for the Delta Green Campaign Manager (`dg-campaign-manager`), a single-user, GM-only web application for organizing tabletop campaigns of *Delta Green: The Role-Playing Game* (Arc Dream, 2016+). It is produced by the `ideate:prd` pipeline and feeds `/ideate:architecture` downstream.

## 2.0 Executive Summary

### 2.1 The Initiative

A personal **GM workbench** for *Delta Green: The Role-Playing Game* (Arc Dream, 2016+) — a single-user, opinionated web application that a Game Master sits at to prep and run a Delta Green campaign. Anchored on running a published Arc Dream campaign (*Impossible Landscapes*-class material) as the v1 use case, the tool replaces scattered Obsidian/Notion notes with a graph-shaped, DG-native data model: typed entities (Scenarios, Scenes, NPCs, PCs, Clues, Items, Factions, Locations, Sessions) connected by first-class relationships, plus a rules-faithful character generator for both PCs and NPCs.

### 2.2 Vision & Scope

Every feature exists to make the GM faster at one of two tasks: prepping the next session or answering a question at the table. The tool's primary job is **persistent memory across sessions** — clue delivery state, NPC continuity, faction movements, PC backstory hooks, Bonds, and Sanity all preserved and surfaced rather than re-derived from prose each week.

In scope (v1 → v1.x):
- PCs, NPCs, and a full DG RAW character generator (v1 MVP).
- Scenarios with scenes, locations, items, NPCs, and clues.
- Investigation graph: typed clue→clue, clue→NPC, clue→faction, clue→location edges with delivery state.
- Sessions on a hybrid in-game / real-world timeline with auto-derived + freeform reports.
- DG-mechanic-faithful Bonds and Sanity tracking.

Out of scope: dice rolling and other VTT/play-surface features; multi-system support; AI/LLM features; mobile-first UI; multi-user features, accounts, sharing, real-time collaboration; player-facing UI.

### 2.3 Success Metrics

To be finalized in Section 6.0. Discovery signals:
- The user runs a complete published DG campaign (e.g., *Impossible Landscapes*) end-to-end through the tool without falling back to Obsidian/Notion or scattered notes.
- Session prep time drops noticeably versus the Obsidian/Notion baseline.
- "What do players currently know about X?" — and "what's at this location?" — are answerable in under ~10 seconds for any entity X.
- The build itself remains enjoyable; the codebase stays hackable as the user iterates.

## 3.0 Background & Strategic Fit

### 3.1 Problem Statement

A Delta Green campaign generates dense, graph-shaped state that no off-the-shelf tool models well. The GM is the sole keeper of:

- **Player knowledge state** — which clues have been delivered, which leads were missed, what each PC currently knows versus what the GM knows. Reconstructing this between sessions is one of the most time-consuming prep steps and is error-prone (contradictions, accidentally re-revealed clues).
- **NPC continuity** — voice, mannerisms, current goals, alive/dead/missing/turned status, faction allegiance, relationships to other NPCs. Without structured tracking, NPC personalities flatten between sessions and consistency erodes.
- **The investigation graph** — the web of clue→clue, clue→NPC, clue→faction, clue→location relationships that *is* the heart of a Delta Green operation. Maintained in the GM's head, this is the single most fragile artifact in the campaign.
- **Faction and conspiracy state** — off-screen movements of antagonist groups (Majestic-12, the Outlaws, opposing programs, mythos entities) that need to evolve session-to-session even when not on-screen.
- **PC backstory hooks** — Bonds and motivations recorded at character creation that the GM is supposed to weave into the campaign months later. These reliably get forgotten.
- **DG-specific mechanical state** — Bonds (with damage tracking from SAN loss and violence) and Sanity (current/max, breaking points, disorders) are core DG mechanics that need first-class structured support, not freeform notes.

The tool's primary job is therefore not authoring (writing scenarios) but **persistent memory across sessions** — preserving and surfacing the campaign's accumulated state so neither prep nor at-the-table play is bottlenecked on the GM's recall.

#### Operational reality / unwritten constraints

- The user is sole author and sole user; there is no team, no review cycle, no usage analytics, no second pair of hands. The tool must be authored *and* operated by one person.
- "Done" is observed at the table: if a campaign runs end-to-end through this tool without the user falling back to scattered notes, the tool works. There is no other validation path.
- The user's prior fallback (Obsidian/Notion) is always one click away. The tool must beat that fallback on day one for the failure modes above; otherwise it will be abandoned.

### 3.2 Goal & Opportunity

#### Why now

The user is about to start a new Delta Green campaign running a **published Arc Dream module/campaign** (e.g. *Impossible Landscapes*, *Iconoclasts*, *A Night at the Opera*, *Music from a Darkened Room*). Published DG campaigns have a distinct shape: dense, pre-authored scenarios with named NPCs, established factions, multi-scene investigations, and clue webs that span sessions. The GM's job is *running* them well, not *writing* them. This is the moment when a tool either earns its keep — by surfacing pre-authored material in a structured, queryable form — or gets abandoned for Obsidian.

#### Strategic opportunity

Build a **DG GM workbench**: an opinionated, single-purpose application a GM sits at to do GM work — prep before sessions and quick lookup during sessions. The opportunity is at the intersection of three gaps:

1. **DG-native data model + char gen** (no other tool has this).
2. **Typed investigation graph with delivery tracking** (no other tool has this).
3. **Persistent campaign memory across sessions** (every other tool reduces this to freeform prose).

A workbench framing — not a database, not a wiki, not a generic worldbuilding tool — gives the product a clear identity: every feature exists to make the GM faster at one of two tasks: *prepping the next session* or *answering a question at the table*.

#### Value proposition

For the user (qualitative):
- **Confidence at the table** — knowing every NPC, location, and clue is one click away with the right context attached.
- **Reduced session-to-session forgetting** — the campaign retains its state automatically.
- **Better Delta Green play** — Bonds and Sanity tracked as structured DG mechanics, not GM-side bookkeeping in a sheet.
- **Build satisfaction** — the project itself is one of the goals; a hackable, owned codebase compounds value beyond its immediate utility.

Quantitative targets:
- Session prep time reduced by a noticeable margin versus Obsidian/Notion baseline.
- Any entity (NPC, clue, location, faction) retrievable in under ~10 seconds at the table.
- A complete published campaign run end-to-end in the tool without falling back to other notes.

#### Opportunity risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep — graph + clues + sessions + char gen + scenarios is wide for one builder | v1 never ships, project becomes another abandoned side project | MVP slice deliberately narrow (PCs + NPCs + char gen first); other domains added in vertical slices |
| Data-entry burden for transcribing a published module | If transcribing the scenario costs more than running it from the book, the tool loses on day one | v1 entity model must be quick to enter; bulk-paste / minimal-required-fields ergonomics; treat data entry UX as a first-class feature |
| Fallback to Obsidian | The user defaults to Obsidian if the tool feels heavier than freeform notes | Workbench framing — every screen must be obviously faster than the equivalent Obsidian flow for the GM's actual tasks |
| Char gen complexity | Full DG RAW char gen is non-trivial (skill packages, profession statlines, derived attributes, Bonds, motivations) | Build the data model first; UI iteratively improved; manual override always available |
| Single-user single-developer scope | No external pressure means the project can drift indefinitely | Time-box to weekends; cut features rather than extend timeline |

#### Key takeaway

The strategic angle is **opinionated GM workbench for running published Delta Green campaigns**, with a graph-shaped, DG-native data model underneath. Every feature exists to beat the user's Obsidian fallback at one specific GM task. Scope discipline — narrow vertical slices, ruthless MVP definition — is the highest-leverage risk mitigation.

### 3.3 Dependencies & Constraints

- **Frontend stack:** React + TypeScript + Vite (consistent with the user's other personal projects).
- **Data layer:** SQLite via Turso (libSQL) with Drizzle ORM. Chosen for graph-friendly relational queries, FK integrity, serverless-friendly ergonomics, and a free tier that vastly exceeds the project's scale.
- **Deployment:** Cloud-hosted on a Vercel/Netlify-class platform. No backend team — server functions or edge functions only.
- **Auth:** None. Single-user app authenticated by environment-bound DB credentials.
- **Budget:** Free tiers only; personal time investment.
- **Timeline:** Soft target of v1 in ~4–6 weekends; no hard external deadline.

### 3.4 Pain Points with Existing Systems

Synthesized from discovery and knowledge Q&A. Pain points are grouped by phase of the campaign loop.

#### Prep-phase pain points

| # | Pain Point | Why it hurts | Implication for the tool |
|---|-----------|--------------|--------------------------|
| P1 | Reconstructing what players currently know | Forces re-reading every prior session note before each prep block | Knowledge state must be explicit, persistent, and queryable per entity |
| P2 | Tracking which clues lead where | Investigation graphs degrade in plain prose; backlinks aren't enough | Clues need typed edges to clues/NPCs/factions/locations and a delivered/undelivered flag |
| P3 | Keeping NPCs internally consistent | NPC voice/motivation drifts across sessions when stored as freeform | NPCs need structured RP hooks, status, faction, relationship edges as first-class fields |
| P4 | Generating reasonable DG NPCs on short notice | Manual stat-block math wastes prep time | Char gen must support NPC quick-gen, ideally with role/profession templates |

#### At-the-table pain points

| # | Pain Point | Why it hurts | Implication for the tool |
|---|-----------|--------------|--------------------------|
| T1 | NPC stat block + RP hooks under time pressure | Players go off-script; GM has 10 seconds to find or fake an NPC | NPCs must be retrievable in seconds by name, faction, or location |
| T2 | "Has this clue been delivered already?" | Risk of contradiction or wasted reveal | Clue records must show delivery state and the session/session-report where they were delivered |
| T3 | Finding clues and information attached to a given location | Players visit a location; GM needs to know what's there *now* | Locations must surface their clues, NPCs, items, and prior session events in one view |

#### Cross-session loss risk (knowledge that fades without tooling)

| # | At-Risk Knowledge | Loss impact | Mitigation by the tool |
|---|-------------------|-------------|------------------------|
| L1 | NPC voices and personalities | Characters flatten; players lose immersion | Persistent RP-hook field surfaced at every NPC encounter |
| L2 | Clue threads and red herrings | Investigation arcs collapse mid-campaign | Clue web stored as typed edges, not prose; queryable forward and backward |
| L3 | Faction / conspiracy state | The campaign loses its sense of forces moving off-screen | First-class Faction entity with status notes and timeline |
| L4 | PC backstory hooks (Bonds, motivations) | Foreshadowed payoffs never land | Bonds tracked structurally with damage state; PC backstory hooks cross-referenced to NPCs and Factions |

#### DG-mechanic-specific pain points

| # | Mechanic | Friction in generic tools | Required support |
|---|----------|---------------------------|------------------|
| M1 | Bonds | Bond is more than a relationship — it has a numeric value that takes damage | First-class Bond entity with target reference, current/max value, damage history |
| M2 | Sanity | SAN is current/max with breaking points, disorders, and structural implications | First-class SAN block on every PC with breaking-point and disorder records |

The user's fallback environment is Obsidian/Notion; every pain point above corresponds to a place where Obsidian/Notion forces freeform prose where structured data would serve the GM better.

### 3.5 Competitive Landscape

The TTRPG GM-tooling market splits into three camps. None covers the user's core need — a Delta Green-native, graph-shaped campaign manager — at acceptable depth.

#### 3.5.1 Competitor Profiles

**Generic-substrate tools (note/wiki applications used as campaign managers):**

| Tool | Description | Strengths | Weaknesses for this use case |
|------|-------------|-----------|------------------------------|
| **Obsidian** (with Dataview, Templater, Excalidraw) | Local-first markdown knowledge graph; large RPG plugin ecosystem | Hackable, file-based, free, fast; strong backlinking | No typed entities; relationships are wiki-link strings, not structured edges; no rules-faithful char gen; investigation graph must be hand-rolled in Dataview |
| **Notion** | Cloud database/page hybrid with relations and rollups | Rich relational properties; good UI; collaboration | Not RPG-native; relations are heavy to set up; no DG-specific char gen; performance degrades with deep graphs; vendor lock-in |

The user has personally used Obsidian/Notion as RPG tools — these are the direct incumbents to displace.

**RPG-native generic campaign tools:**

| Tool | Description | Strengths | Weaknesses for this use case |
|------|-------------|-----------|------------------------------|
| **Kanka** | Free/freemium campaign manager with typed entities (characters, locations, items, journals, calendars, organizations, notes, tags, attributes) | Closest mental model to what the user wants; entity types + relationships built-in; calendars; campaign-scoped | System-agnostic — no DG stat blocks, no Bonds/SAN/skill-package mechanics; clue tracking is a generic "note" type; no rules-faithful char gen; relationships are flat tags, not a typed investigation graph |
| **World Anvil** | Paid worldbuilding tool with extensive templates and articles | Mature, large community, rich text editing, lots of templates | Worldbuilding-first, not campaign-running-first; templates are prose-heavy; relationships shallow; expensive paid tiers; UX is dense |
| **Legend Keeper** | Paid wiki-style tool for campaigns | Clean wiki UX | Paid; system-agnostic; no investigation graph; no DG-specific anything |

**System-specific tools (DG-adjacent):**

| Tool | Description | Strengths | Weaknesses for this use case |
|------|-------------|-----------|------------------------------|
| **Community DG character sheet apps** (Google Docs templates, scattered web char-gen tools) | One-off character generators for DG | Cover the char-gen need at file level | Not connected to anything else; no campaign context; no NPC roster; no clue/scenario tracking |

**Excluded by user request:** Foundry VTT and other VTTs are play surfaces, not prep/organization tools, and are out of scope as competitors even though Foundry has strong DG community modules.

#### 3.5.2 Comparative Analysis

| Dimension | Obsidian/Notion | Kanka / World Anvil / Legend Keeper | DG community char-gen tools | **DG Campaign Manager (proposed)** |
|-----------|-----------------|-------------------------------------|------------------------------|------------------------------------|
| Typed entities (Scenario, Scene, NPC, Clue, Item, Faction, Session, PC) | No (free-form pages) | Partial (generic types) | No | **Yes, DG-native** |
| First-class typed relationships (graph edges) | No (string backlinks) | Partial (tags + relations) | No | **Yes** |
| DG-faithful character generator (Bonds, SAN, skill packages) | No | No | Partial (PC only) | **Yes (PC + NPC)** |
| Clue/investigation graph with delivery tracking | No | No | No | **Yes** |
| In-game timeline + real-session metadata | Plugin-only / no | Calendar (generic) | No | **Yes, hybrid** |
| Auto-derived session reports | No | No | No | **Yes** |
| GM workflow speed (single-purpose UX) | Generic | Generic | N/A | **Yes** |
| Free / personal-scale | Free (Obsidian) / freemium (Notion) | Free tier (Kanka) / paid | Free | **Free (free-tier infra)** |

#### 3.5.3 Market Gaps

1. **No Delta Green-native campaign tool exists.** The intersection of "DG ruleset support" and "full campaign management" is empty. Char-gen tools cover the rules surface; campaign tools cover the organization surface; nothing crosses the two.
2. **Investigation graph is universally weak.** Across the entire surveyed landscape, "clue X implicates faction Y, was found in scenario A, was delivered to players in session 3, and connects to clue Z" is impossible to express as a structured query. Every tool reduces this to free-form prose with hand-maintained backlinks.
3. **Session reports are manual everywhere.** No surveyed tool auto-derives session reports from the entities touched during a session.

#### 3.5.4 Key Takeaways

- **Primary "competition"** is the user's own current habit of using Obsidian/Notion as a campaign tool. The differentiation must be palpable on day one or the user will retreat to Obsidian — which is a real risk for a personal craft project.
- **Differentiation focus (per discovery):** DG-native data model + graph-first design + clue/investigation tracking + GM workflow speed. All four matter; clue/investigation tracking is the unique market gap.
- **Strategic implication:** the design should lead with typed entities and typed relationships from day one. A generic page/wiki layer would put the product into direct competition with Obsidian/Notion/Kanka — a fight the product cannot win on breadth.

## 4.0 Target Audience & Personas

The product has a single user with multiple operating modes. Personas below describe the same human (Bartosz) in three distinct GM contexts; each context drives different feature priorities.

### Persona 1 — The Prepping GM

- *Description:* Bartosz, sole user, working through next session's material between sessions. Computer, time, no players present.
- *Goals:* Transcribe published-module material into the system; flesh out NPC RP hooks; pre-link clues to the entities they implicate; review what players currently know; sketch the next session's spine.
- *Pain points:* Data-entry burden; reconstructing player knowledge state; keeping NPCs internally consistent; tracking the clue web. (Maps to PRD §3.4 prep-phase pain points.)
- *Critical features:* REQ-016 bulk MD import; REQ-001/003 typed entities + relationships; REQ-008 char form; REQ-009 clue with provenance; REQ-019 prep mode.

### Persona 2 — The GM at the Table

- *Description:* Bartosz, mid-session, players around the table, time pressure, partial attention.
- *Goals:* Find any NPC/clue/location in seconds; mark clue delivery; log SAN/Bond changes as they happen; never tell players something contradictory to prior reveals.
- *Pain points:* Scrambling for NPC stat blocks and RP hooks; "has this clue been delivered?"; finding what's at the current location; mid-session continuity. (Maps to PRD §3.4 at-the-table pain points.)
- *Critical features:* REQ-013 Cmd-K; REQ-019/020 play mode + primary actions; REQ-024 location surfaces local context; REQ-009 clue delivery state; REQ-006/007 Bond/SAN logging.

### Persona 3 — The Campaign Memory Keeper

- *Description:* Bartosz, days or weeks since the last session, returning to material that has accumulated state.
- *Goals:* Trust that the campaign's state is preserved without re-reading every prior session note; surface forgotten threads (PC backstory hooks, faction movements, red herrings); export portable backups.
- *Pain points:* NPC voices fade; clue threads bleed details over weeks; faction state drifts; backstory hooks never pay off. (Maps to PRD §3.4 cross-session loss risks.)
- *Critical features:* REQ-011 auto-derived session reports; REQ-015 entity detail surfaces relationships + recent activity; REQ-017/018 MD export; REQ-025 faction with status timeline; REQ-006 Bond damage history.

### 4.1 User Stories

Anchor user stories driving v1. Each is traceable to one or more REQ-IDs.

1. As the GM, I want to import an entire published scenario from a structured Markdown document so that transcribing modules does not cost more than running them. *(REQ-016, REQ-001, REQ-002)*
2. As the GM, I want every NPC, clue, location, and faction findable in under a second from a Cmd-K palette so that I never lose tempo at the table. *(REQ-013, REQ-N01)*
3. As the GM, I want to mark clues delivered in a specific session and to specific PCs so that I can answer "what do players know?" instantly and avoid contradicting prior reveals. *(REQ-009, REQ-011)*
4. As the GM, I want Bonds and Sanity tracked as structured DG mechanics with damage history so that the heartbeat of Delta Green play is preserved across sessions. *(REQ-006, REQ-007)*
5. As the GM, I want a session's entity activity to auto-build the session report so that recap is a side effect of running the session, not a separate prep task. *(REQ-011)*
6. As the GM, I want to switch between prep mode and play mode so that the screen shows me what the moment demands — full editing while prepping, fast retrieval while playing. *(REQ-019, REQ-020)*
7. As the GM, I want a Markdown export of any entity and an archive of the whole campaign so that my campaign data is portable, git-mirrorable, and never trapped in one vendor. *(REQ-017, REQ-018, REQ-N04)*
8. As the GM, I want a Location page to show every clue, NPC, item, and prior session event tied to that location so that I have a single read-out when players arrive somewhere. *(REQ-024, REQ-015)*

## 5.0 Key Features & Requirements

### 5.1 Functional Requirements

Requirements use REQ-IDs in the form `REQ-NNN`. Acceptance criteria use Given/When/Then.

#### Domain model — entities & relationships

**REQ-001 — Typed entity model (Must)**
- *Description:* The system supports the following first-class entity types: Campaign, Scenario, Scene, NPC, PC, Clue, Item, Faction, Location, Session, Bond.
- *User story:* As the GM, I want every campaign concept stored as a typed entity so that I can attach structured fields and relationships rather than freeform prose.
- *Acceptance:* Given a fresh campaign, When the GM opens any of the entity types listed above, Then the type has its own create/list/detail pages and a stable schema.

**REQ-002 — Scene as hybrid nestable entity (Must)**
- *Description:* Scenes belong to a parent Scenario but have their own URL and detail page; other entities can reference Scenes directly.
- *User story:* As the GM, I want to link a Clue or NPC to a specific Scene without flattening the Scene into the Scenario.
- *Acceptance:* Given a Scenario S with a Scene X, When the GM links a Clue to X, Then the Clue's relationships show Scene X (not just Scenario S).

**REQ-003 — Typed relationships (Must)**
- *Description:* Relationships between entities are typed first-class records (not freeform backlinks). Supported relationship kinds include at minimum:
  `Clue → Clue`, `Clue → NPC`, `Clue → Faction`, `Clue → Location`, `Clue → Item`, `Clue → Scene`, `NPC ↔ NPC`, `NPC → Faction`, `NPC → Location`, `Item → Location`, `Scene → Location`.
- *User story:* As the GM, I want relationships to be typed and queryable so that "show me every clue implicating Faction X" is a single query, not a search across prose.
- *Acceptance:* Given a Clue linked to a Faction, When the GM views the Faction page, Then the Clue appears in a "Implicating clues" section automatically.

**REQ-004 — PC entity with DG RAW fields (Must)**
- *Description:* PC includes profession, statistics (STR/CON/DEX/INT/POW/CHA), derived attributes (HP, WP, BP, SAN max), skills, motivations, Bonds (link to REQ-006), SAN block (link to REQ-007), backstory hooks.
- *Acceptance:* The PC schema contains all DG: The Role-Playing Game (Arc Dream, 2016+) RAW PC fields.

**REQ-005 — NPC entity (Must)**
- *Description:* NPC includes stat block (full or simplified), RP hooks (mannerisms, voice, secrets), faction reference, alive/dead/missing/turned status, location, current goal, relationships to other NPCs.
- *Acceptance:* Every NPC supports the four RP/continuity dimensions surfaced in knowledge phase: RP hooks, faction, relationship web, status.

**REQ-006 — Bonds as structured entity (Must)**
- *Description:* Bond is a first-class entity with: source PC, target (NPC or PC), category/label, current value, max value, damage events log.
- *User story:* As the GM, I want Bonds tracked numerically with damage history so that I see exactly when and why a Bond degraded.
- *Acceptance:* Given a PC with a Bond to NPC X at value 12, When the GM applies 3 Bond damage with a reason and session reference, Then the Bond is at value 9 and the damage event is logged with timestamp and session link.

**REQ-007 — Sanity tracking (Must)**
- *Description:* Each PC has a Sanity block: current SAN, maximum SAN, breaking point list, adapted-to list, disorders list, SAN change log.
- *Acceptance:* Given a PC with SAN 50/65, When the GM applies a 5-point SAN loss with a source, Then current SAN is 45 and the loss is logged; if a breaking point is crossed, the system flags it.

**REQ-008 — Character form with skill-package presets (Must)**
- *Description:* PC and NPC share one editor. Profession/skill-package presets pre-fill skill values; every field remains manually editable. Same form for PC and NPC (NPCs may leave more fields empty).
- *Acceptance:* Given the GM picks profession "Federal Agent", When the form opens, Then DG RAW skill-package skill values are pre-filled and editable.

#### Investigation graph & clues

**REQ-009 — Clue entity with provenance & delivery (Must)**
- *Description:* Clue includes: title, description, origin Scenario, typed edges (per REQ-003), and a delivery record listing which Sessions delivered the clue and to which PCs.
- *User story:* As the GM, I want each clue to know where it came from and whether it has been delivered, so that I can answer "what do players know?" instantly.
- *Acceptance:* Given a Clue not yet delivered, When the GM marks it delivered in Session 7 to PCs A and B, Then the Clue's delivery state shows session-7 + recipients; the Session 7 page lists the clue under delivered clues.

**REQ-024 — Location entity surfaces local context (Must)**
- *Description:* Location detail page shows linked clues, present NPCs, items at the location, and prior session events that occurred there.
- *Acceptance:* Given a Location with linked NPCs and clues, When the GM opens the Location at the table, Then all linked entities are visible without navigation.

**REQ-025 — Faction entity (Must)**
- *Description:* Faction includes name, agenda, status timeline (ordered notes about off-screen movements), member NPCs, implicating clues.
- *Acceptance:* Given a Faction, When the GM views it, Then current status, member NPCs, and implicating clues are all visible.

**REQ-026 — Item entity (Must)**
- *Description:* Item includes name, description, current location reference, owner reference (NPC or PC), referencing clues/scenes.
- *Acceptance:* Given an Item, When its owner or location changes, Then the change is recorded and the prior owner/location remain in history.

#### Sessions & timeline

**REQ-010 — Session entity with hybrid timeline (Must)**
- *Description:* Session has both a real-world date (IRL) and an in-game date range. Sessions are ordered primarily by in-game time; a real-session view is also available.
- *Acceptance:* Given two sessions with overlapping in-game dates, When viewing the in-game timeline, Then both appear at their in-game positions; the real-session view orders them by IRL date.

**REQ-011 — Auto-derived session report (Must)**
- *Description:* Entities tagged during a session (NPCs encountered, clues delivered, scenes played, locations visited, SAN/Bond damage applied) auto-populate a structured event log on the Session page. The GM can layer freeform notes on top.
- *Acceptance:* Given the GM marks 2 clues delivered, 3 NPCs encountered, and 1 scene played during Session 5, When the Session 5 page loads, Then the structured event log lists all six items with links; the freeform notes section is empty and editable.

**REQ-012 — Player handout export from session (Should)**
- *Description:* From a Session, the GM can export a player-safe Markdown handout containing only player-revealed information (delivered clues, encountered NPCs by name, locations visited, GM-flagged player-safe notes).
- *Acceptance:* Given a Session with mixed GM-only and player-safe notes, When exporting a handout, Then only player-safe content is included.

#### Retrieval & navigation

**REQ-013 — Cmd-K global search palette (Must)**
- *Description:* A keyboard-driven palette searches across all entity types by name and returns results in <1s for representative datasets (per REQ-N01). Selecting a result navigates to its detail page.
- *Acceptance:* Given a dataset with 500+ entities, When the GM presses Cmd-K and types 3+ characters, Then matching entities across all types appear within 1s.

**REQ-014 — List views with filtering (Must)**
- *Description:* Each entity type has a list view supporting filtering by faction, status, location, scenario, or other type-appropriate facets.
- *Acceptance:* Given the NPC list, When the GM filters by faction, Then only NPCs of that faction are shown.

**REQ-015 — Entity detail surfaces relationships (Must)**
- *Description:* Every entity detail page surfaces incoming and outgoing typed relationships and recent session activity touching the entity.
- *Acceptance:* Given an NPC referenced by 3 clues and present in 2 sessions, When the GM opens the NPC, Then the 3 clues and 2 sessions are visible without manual navigation.

#### Data ingest & export

**REQ-016 — Bulk import from Markdown template (Must)**
- *Description:* The system ingests a structured Markdown/YAML scenario document defining a Scenario with its Scenes, NPCs, Clues, Items, and Locations and creates all entities and relationships in one operation. The template format is documented and stable across versions.
- *Acceptance:* Given a valid scenario MD file, When imported, Then all entities and inter-entity links are created; validation errors point to the offending line/field.

**REQ-017 — Per-entity Markdown export (Must)**
- *Description:* Every entity supports a "Download as Markdown" action that produces a single MD file containing the entity's fields and outgoing relationships.
- *Acceptance:* Given any entity, When the GM clicks export, Then a deterministic MD file is downloaded.

**REQ-018 — Campaign-wide Markdown archive (Should)**
- *Description:* On demand, export the entire campaign as a directory of Markdown files (one per entity), suitable for git mirroring.
- *Acceptance:* Given a populated campaign, When the GM triggers archive export, Then a zip/folder of MD files is produced; round-trip via REQ-016 reconstructs the campaign (best-effort, lossy on derived fields).

#### UI modes

**REQ-019 — Distinct prep and play modes (Must)**
- *Description:* The application has two top-level modes: prep (full editing affordances; default) and play (read-optimized, minimizes editing surfaces, emphasizes Cmd-K and delivery actions). Mode is GM-toggled.
- *Acceptance:* Given play mode, When the GM views any entity, Then editing buttons are de-emphasized and primary actions are "mark clue delivered", "log SAN/Bond change", "open Cmd-K".

**REQ-020 — Play-mode primary actions (Must)**
- *Description:* In play mode, the global toolbar exposes one-click actions for the most common at-table tasks: open Cmd-K, mark clue delivered, log SAN change, log Bond damage, jump to Session report.
- *Acceptance:* All five actions are reachable in <=1 click or 1 keyboard shortcut from any page in play mode.

#### Future / lower priority

**REQ-021 — Guided RAW char-gen wizard (Could)**
- *Description:* Step-by-step character creation flow with rolling/point-buy, derived stats, skill-package application, and validation. Layered on top of the form-with-presets baseline (REQ-008).
- *Acceptance:* When the wizard is offered alongside the existing form, an empty PC can be completed end-to-end with all RAW-derived fields automatically computed and validated.

**REQ-022 — Investigation graph visualization (Could)**
- *Description:* Visual node/edge view of clues and entity relationships, with filtering and clue-delivery overlay. Defer until list-view-driven retrieval is observed in real use.
- *Acceptance:* Given a campaign with linked clues, NPCs, and factions, When the GM opens the graph view, Then nodes are rendered for each entity type and edges follow the typed relationships from REQ-003; delivered clues are visually distinguishable from undelivered ones.

**REQ-023 — Multi-campaign support (Won't, v1)**
- *Description:* Top-level Campaign entity with isolation between campaigns; cross-campaign entity reuse. Deferred — v1 is single-campaign with the campaign implicit at the database level.
- *Acceptance:* When implemented, the GM can create multiple Campaigns, each with its own entity scope, and optionally share NPCs/Factions/Items across them via explicit reuse.

### 5.2 Non-Functional Requirements

Per ISO/IEC/IEEE 29148 §4 quality attributes.

#### Performance

**REQ-N01 — Cmd-K latency (Must)**
- Cmd-K results render within 1s for datasets of up to 1,000 entities of mixed types (representative campaign scale).

**REQ-N02 — Page navigation latency (Must)**
- Inter-page navigation (entity → entity) completes within 500ms on a typical broadband connection from a Vercel edge region.

#### Security

**REQ-N03 — Single-user access model (Must)**
- No interactive auth in the application. Access is controlled by the privacy of the deployment URL and the Turso credentials held in environment variables. There is no user account system, no role model, no session.
- *Rationale:* Single-user GM tool; multi-user features are out of scope (REQ-W04). Adding auth costs more than it earns at this scale.

#### Reliability & data portability

**REQ-N04 — Markdown export portability (Must)**
- Every entity is exportable as Markdown at any time (REQ-017); a campaign archive (REQ-018) is producible on demand. The user retains a portable, human-readable copy of all campaign data.

**REQ-N05 — DB backup (Should)**
- Daily automated backup of the Turso database via the platform's point-in-time recovery; verified at least once during initial setup.

#### Usability

**REQ-N06 — Desktop browser support (Must)**
- Latest two stable versions of Chrome, Firefox, and Safari on desktop. Mobile is explicitly out of scope (REQ-W04 / 5.4).

**REQ-N07 — Keyboard-first play mode (Should)**
- Play mode supports keyboard-driven navigation for the five primary actions in REQ-020 plus Cmd-K. Mouse use is supported but not required for typical at-table flows.

#### Maintainability

**REQ-N08 — TypeScript strict mode + linting (Must)**
- TypeScript with `strict: true`. ESLint + Prettier configured. All committed code passes both.

**REQ-N09 — Unit testing baseline (Must)**
- Vitest configured. Critical domain logic — char gen field math, SAN/Bond mutation, clue-delivery state transitions, MD import parsing — has unit tests.

**REQ-N10 — Drizzle migrations (Must)**
- All schema changes go through Drizzle migrations checked into the repo. The repo can recreate the schema from scratch in any environment.

**REQ-N11 — Foundational scaffold (Must)**
- Greenfield repo bootstrapped with: Vite + React + TS, ESLint, Prettier, Vitest, Drizzle, libSQL client, Vercel deploy config, git hooks (lint-staged + Husky or equivalent), README. This is the foundational story for `/ignite:kickoff`.

#### Hosting & infrastructure

**REQ-N12 — Vercel hosting (Must)**
- The application is deployed to Vercel. Server functions (if needed) use Vercel's runtime. Free tier is the operating budget.

### 5.3 Key Integrations

| ID | System | Purpose | Interface | Notes |
|----|--------|---------|-----------|-------|
| INT-001 | **Turso (libSQL)** | Primary data store | libSQL client over HTTPS | Free tier; serverless-friendly; supports Drizzle |
| INT-002 | **Vercel** | Hosting + (optional) serverless functions | Vercel CLI / Git integration | Free tier; React+Vite first-class support |

No other external systems are integrated in v1. There is no auth provider (REQ-N03), no analytics, no error reporting service, no AI/LLM API (out of scope). These can be added later if a need emerges.

### 5.4 Out of Scope

Items explicitly excluded from v1 with rationale. Each is a Won't-Have under MoSCoW.

| ID | Excluded | Rationale | Future consideration |
|----|----------|-----------|----------------------|
| REQ-W01 | Dice rolling, combat tracker, VTT/play-surface features | Tool is a prep + retrieval workbench, not a play surface; user uses VTTs for play | Reconsider only if at-table use surfaces a real workflow gap |
| REQ-W02 | Multi-system support (Call of Cthulhu, other RPGs) | DG-native data model is the primary differentiator; abstraction would dilute it | Never planned; would require a separate product |
| REQ-W03 | AI/LLM features (auto-generation, summarization) | User explicitly opted out; preserves authorial voice and avoids dependency on third-party AI | Reconsider only if auto-derived session prose becomes painful and structured event log isn't enough |
| REQ-W04 | Mobile-first / mobile-optimized UI | Desktop is the GM's primary surface; mobile responsive is not a goal | Could add a read-only mobile view if at-table phone use becomes routine |
| REQ-W05 | Multi-user features, accounts, sharing, real-time collaboration | Personal single-user tool; multi-user introduces auth, isolation, and a different product surface | Hard no for v1; deferred to "maybe never" |
| REQ-W06 | Player-facing UI inside the app | Players interact via exported handouts (REQ-012), not the app | Could add a static read-only player handout site as a separate deploy if useful |
| REQ-W07 | Investigation graph visualization (visual node/edge view) | List-view-driven retrieval may suffice; defer until real usage shows the need | Tracked as REQ-022 (Could) |
| REQ-W08 | Guided RAW char-gen wizard | Form-with-presets is sufficient for v1; wizard adds scope without unblocking the MVP | Tracked as REQ-021 (Could) |
| REQ-W09 | Cross-campaign entity reuse | v1 is single-campaign; multi-campaign architecture postponed | Tracked as REQ-023 (Won't, v1) |

## 6.0 Verification & Validation

### 6.1 Outcome Metrics

| ID | Metric | Measurement Method | Desired Outcome |
|----|--------|--------------------|-----------------|
| OM-1 | Tool self-sufficiency for a published campaign run | Self-report at end of campaign: did the GM ever fall back to Obsidian/Notion/scattered notes for primary campaign tracking? | No fallback for any of the v1 Must-Have feature areas |
| OM-2 | Session prep time vs. baseline | Self-report comparison after 5+ sessions | Prep time noticeably lower than the GM's prior Obsidian/Notion baseline for equivalent material |
| OM-3 | At-table retrieval speed | Stopwatch self-test at the table: time from "what do players know about X?" question to confident answer on screen | Under 10 seconds for any entity in a campaign of representative size (a few hundred entities) |
| OM-4 | Cmd-K latency | Manual measurement on a 1,000-entity dataset | Results render in under 1s (REQ-N01) |
| OM-5 | Build satisfaction | Self-report after each weekend session of work | Project remains enjoyable to work on; codebase remains hackable |

### 6.2 Acceptance Criteria

The project is "done v1" when, with a fresh deploy and an imported published campaign:

1. The GM can run an end-to-end session of that campaign using only the tool — char sheets, clue lookups, NPC retrieval, SAN/Bond logging, and session report — without opening another note source.
2. All Must-Have functional requirements (§5.1) have shipped behavior matching their acceptance criteria.
3. All Must-Have non-functional requirements (§5.2) are met on the deployed Vercel environment with a representative dataset.
4. The MD bulk import (REQ-016) has successfully ingested at least one full published Arc Dream scenario.
5. The MD per-entity export (REQ-017) and campaign archive (REQ-018, Should) produce content that round-trips usably back through REQ-016.

## 7.0 Risks, Assumptions, & Mitigations

Risk score scale: 1–9 (Likelihood 1–3 × Impact 1–3).

| ID | Risk | Source | Likelihood | Impact | Score | Mitigation |
|----|------|--------|-----------:|-------:|------:|------------|
| R-1 | **Scope creep** — graph + clues + sessions + char gen + scenarios is a lot for one builder | §3.2 (opportunity) | 3 | 3 | 9 | Strict MoSCoW discipline; ship Must-Haves only for v1; defer Could-Haves explicitly; cut features rather than extend timeline |
| R-2 | **Data-entry burden for published modules** — if transcribing costs more than running from the book, the tool loses on day one | §3.2 (opportunity) | 3 | 3 | 9 | REQ-016 bulk MD import is a Must-Have; treat MD template ergonomics as a first-class design concern; first published-scenario import is the v1 acceptance gate |
| R-3 | **Fallback to Obsidian** — the user's own habit is the strongest competitor | §3.5 (competitive) | 2 | 3 | 6 | Workbench framing forces every feature to beat Obsidian on a specific GM task; Cmd-K retrieval and play-mode primary actions target this directly; daily use during a real campaign is the validation channel |
| R-4 | **Char gen complexity** — full DG RAW char gen is non-trivial | §3.2 (opportunity) | 2 | 2 | 4 | v1 ships form-with-presets only (REQ-008); guided wizard deferred to REQ-021 (Could); manual override always available so partial automation never blocks character creation |
| R-5 | **Single-developer single-user — no external pressure** — project can drift indefinitely | §3.2 (opportunity) | 3 | 2 | 6 | Time-box to weekends; v1 is anchored to an actual upcoming campaign whose start date creates real pressure; ship narrow vertical slices over 4–6 weekends |
| R-6 | **Single point of failure for campaign data** — Turso outage or deletion = lost campaign | §3.4 (operational) | 1 | 3 | 3 | REQ-N04/REQ-017/REQ-018 ensure MD export is always available; REQ-N05 daily backups via platform; user can git-mirror MD archives for disaster recovery |
| R-7 | **MD round-trip fidelity** — bulk import (REQ-016) and archive export (REQ-018) may not be lossless | §5.1 (requirements) | 2 | 2 | 4 | Document round-trip semantics explicitly; treat import as authoritative for ingest, export as best-effort for archive; tests cover the round-trip on representative scenarios |
| R-8 | **Workbench/IDE feature creep** — "make it powerful" can outpace "make it usable" | §3.2 (opportunity, identity framing) | 2 | 2 | 4 | Workbench framing is the rubric: every feature must beat Obsidian on a specific GM task or it doesn't ship; defer anything that fails the rubric |

### Assumptions

| ID | Assumption | Validation |
|----|-----------|------------|
| A-1 | The user will run a real published Delta Green campaign through the tool starting after v1 ships | Self-evident — the tool's existence is anchored on this campaign; if it doesn't happen, the tool's value evaporates regardless of build quality |
| A-2 | Turso free tier and Vercel free tier are sufficient for a single-user campaign tool indefinitely | Both platforms publicly publish quotas that exceed this scale by orders of magnitude |
| A-3 | Drizzle + libSQL ergonomics support the graph queries needed (entity → typed relationships → reverse refs) | Validated by existence proofs in similar apps; first integration sprint will confirm |
| A-4 | The Markdown scenario template (REQ-016) can be designed to express the full entity model without becoming awkward to author | First import of a real published scenario is the validation; if awkward, simplify schema before adding more entity types |

## 8.0 Appendix

### 8.1 Glossary

| Term | Definition |
|------|------------|
| **Delta Green (DG)** | *Delta Green: The Role-Playing Game*, Arc Dream Publishing (2016+). A standalone d100 RPG of modern federal-conspiracy occult horror, derived from Call of Cthulhu. The product targets this edition specifically. |
| **GM** | Game Master — the person running a tabletop RPG session; the sole user of this product. |
| **PC** | Player Character — a character controlled by a player. In DG RAW: a Federal Agent or comparable operator with stats, skills, profession, motivations, Bonds, and Sanity. |
| **NPC** | Non-Player Character — any character controlled by the GM; in DG ranges from Friendlies and contacts to opposing agents and unnatural entities. |
| **Bond** | A DG mechanic representing a relationship between a PC and another person (NPC or PC). Bonds have numeric values and take damage from SAN loss and violence. First-class entity in this product (REQ-006). |
| **SAN / Sanity** | A DG mechanic representing mental fortitude. Tracked as current/max with breaking points and disorders (REQ-007). |
| **Scenario** | A self-contained Delta Green operation/adventure. Can be a published Arc Dream module (e.g., *Music from a Darkened Room*) or homebrew. |
| **Scene** | A subdivision of a Scenario — a specific location, encounter, or beat within the operation. Hybrid nestable entity (REQ-002). |
| **Clue** | A piece of evidence the players can discover. Has provenance (origin Scenario), typed edges to other entities, and delivery state (REQ-009). |
| **Faction** | An organized group with an agenda (e.g., Majestic-12, the Outlaws, opposing programs, mythos cults). First-class entity (REQ-025). |
| **Investigation graph** | The web of typed relationships between Clues, NPCs, Factions, Locations, Items, and Scenes. Core to the product's identity. |
| **Prep mode / Play mode** | Two top-level UI modes (REQ-019/020). Prep is editing-heavy; play is read-optimized for use at the table. |
| **MoSCoW** | Prioritization framework: Must-Have, Should-Have, Could-Have, Won't-Have. |
| **REQ-ID** | Unique identifier for a requirement, e.g., `REQ-001`. NFR variants use `REQ-NNN` (non-functional), `REQ-WNN` (won't), `INT-NNN` (integration). |
| **Workbench** | The product's identity framing — an opinionated single-purpose application a GM sits at to do GM work, distinct from a database, a wiki, or a worldbuilding tool. |
| **Turso / libSQL** | The data store. Turso is a hosted serverless SQLite platform; libSQL is the underlying SQLite-compatible engine and client. |
| **Drizzle** | TypeScript ORM with SQL-first ergonomics; the chosen abstraction for libSQL access and migrations. |

### 8.2 References

| Source | Type | Role |
|--------|------|------|
| `ideate/prd-audit.md` — `## Discovery` | Synthesized stakeholder source | All requirement extraction; substitutes for transcripts in this synthetic-source project |
| `ideate/prd-audit.md` — `## Competitors` | Wave 1 audit | Competitive landscape findings (PRD §3.5) |
| `ideate/prd-audit.md` — `## Knowledge` | Wave 1 audit | Operational pain points and DG-mechanic priorities (PRD §3.1, §3.4) |
| `ideate/prd-audit.md` — `## Opportunity` | Wave 1 audit | Strategic identity and value proposition (PRD §3.2) |
| `ideate/prd-audit.md` — `## Requirements` | Wave 2 audit | MoSCoW prioritization decisions and verification Q&A (PRD §5.1–5.4, §8.3) |
| `ideate/prd-audit.md` — `## Requirements Validation` | Validation gate audit | Quality findings and resolutions before synthesis |
| Delta Green: The Role-Playing Game (Arc Dream, 2016+) | External published source | Authoritative definition of all DG-RAW field shapes (PC, NPC, Bonds, SAN, skill packages) referenced by §5.1 |

### 8.3 Requirements Traceability

REQ-ID index. Each row: ID · one-line description · MoSCoW priority · owning section.

| REQ-ID | Description | Priority | Section |
|--------|-------------|----------|---------|
| REQ-001 | Typed entity model (Campaign, Scenario, Scene, NPC, PC, Clue, Item, Faction, Location, Session, Bond) | Must | 5.1 |
| REQ-002 | Scene as hybrid nestable entity (own URL, lives under Scenario) | Must | 5.1 |
| REQ-003 | Typed first-class relationships between entities | Must | 5.1 |
| REQ-004 | PC entity with full DG RAW fields | Must | 5.1 |
| REQ-005 | NPC entity with stats + RP hooks + faction + status + relationships | Must | 5.1 |
| REQ-006 | Bonds as first-class structured records with damage history | Must | 5.1 |
| REQ-007 | Sanity tracking (current/max, breaking points, disorders, change log) | Must | 5.1 |
| REQ-008 | Character form with skill-package presets, shared PC/NPC editor | Must | 5.1 |
| REQ-009 | Clue with provenance + typed edges + delivery tracking | Must | 5.1 |
| REQ-010 | Session with hybrid in-game / real-world timeline | Must | 5.1 |
| REQ-011 | Auto-derived session report from tagged entity activity + freeform notes | Must | 5.1 |
| REQ-012 | Player handout export from session | Should | 5.1 |
| REQ-013 | Cmd-K global search palette | Must | 5.1 |
| REQ-014 | List views per entity type with filtering | Must | 5.1 |
| REQ-015 | Entity detail surfaces incoming/outgoing relationships + recent session activity | Must | 5.1 |
| REQ-016 | Bulk import scenario from structured Markdown template | Must | 5.1 |
| REQ-017 | Per-entity Markdown export | Must | 5.1 |
| REQ-018 | Campaign-wide Markdown archive export | Should | 5.1 |
| REQ-019 | Distinct prep and play modes | Must | 5.1 |
| REQ-020 | Play-mode primary actions (Cmd-K + 4 GM ops) | Must | 5.1 |
| REQ-021 | Guided RAW char-gen wizard | Could | 5.1 |
| REQ-022 | Investigation graph visualization | Could | 5.1 |
| REQ-023 | Multi-campaign support / cross-campaign reuse | Won't (v1) | 5.1 |
| REQ-024 | Location surfaces clues + NPCs + items + prior session events | Must | 5.1 |
| REQ-025 | Faction with status timeline, member NPCs, implicating clues | Must | 5.1 |
| REQ-026 | Item with location + owner + reverse refs | Must | 5.1 |
| REQ-N01 | Cmd-K results <1s for 1,000-entity datasets | Must | 5.2 |
| REQ-N02 | Page navigation <500ms | Must | 5.2 |
| REQ-N03 | No interactive auth; deployment-URL + env-credential access model | Must | 5.2 |
| REQ-N04 | Markdown export portability for every entity | Must | 5.2 |
| REQ-N05 | Daily automated DB backup via Turso | Should | 5.2 |
| REQ-N06 | Desktop browsers (Chrome/Firefox/Safari latest two) | Must | 5.2 |
| REQ-N07 | Keyboard-first play mode | Should | 5.2 |
| REQ-N08 | TypeScript strict + ESLint + Prettier | Must | 5.2 |
| REQ-N09 | Vitest unit tests for critical domain logic | Must | 5.2 |
| REQ-N10 | Drizzle migrations check-in | Must | 5.2 |
| REQ-N11 | Foundational greenfield scaffold | Must | 5.2 |
| REQ-N12 | Vercel hosting | Must | 5.2 |
| INT-001 | Turso (libSQL) integration | Must | 5.3 |
| INT-002 | Vercel integration | Must | 5.3 |
| REQ-W01 | Dice/VTT/play features excluded | Won't | 5.4 |
| REQ-W02 | Multi-system support excluded | Won't | 5.4 |
| REQ-W03 | AI/LLM features excluded | Won't | 5.4 |
| REQ-W04 | Mobile-first UI excluded | Won't | 5.4 |
| REQ-W05 | Multi-user/accounts/collab excluded | Won't | 5.4 |
| REQ-W06 | Player-facing UI excluded | Won't | 5.4 |
| REQ-W07 | Investigation graph viz (v1) — tracked as REQ-022 Could | Won't (v1) | 5.4 |
| REQ-W08 | Guided char-gen wizard (v1) — tracked as REQ-021 Could | Won't (v1) | 5.4 |
| REQ-W09 | Cross-campaign reuse (v1) — tracked as REQ-023 | Won't (v1) | 5.4 |
