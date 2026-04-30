# Delta Green Campaign Manager

A single-user, GM-only web application for organizing tabletop campaigns of _Delta Green: The Role-Playing Game_ (Arc Dream, 2016+). A personal **GM workbench** that replaces scattered Obsidian/Notion notes with a graph-shaped, DG-native data model: typed entities (Scenarios, Scenes, NPCs, PCs, Clues, Items, Factions, Locations, Sessions) connected by first-class typed relationships, plus a rules-faithful character generator for both PCs and NPCs.

Every feature exists to make the GM faster at one of two tasks: **prepping the next session** or **answering a question at the table**. The tool's primary job is persistent memory across sessions — clue delivery state, NPC continuity, faction movements, PC backstory hooks, Bonds, and Sanity all preserved and surfaced rather than re-derived from prose each week.

## Stack

Vite + React + TypeScript (strict) · Tailwind · TanStack Query · react-hook-form + Zod · Drizzle ORM · Turso (libSQL) · Vercel (Serverless Functions) · Vitest

## Scripts

```bash
pnpm install      # install dependencies
pnpm dev          # start the dev server
pnpm build        # typecheck + produce a deployable bundle
pnpm test         # run Vitest
pnpm lint         # ESLint
pnpm format       # Prettier write
```

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document
- [`docs/architecture.md`](docs/architecture.md) — Arc42 architecture document
- [`backlog/`](backlog/) — milestones and issues (markdown-based local backlog)

## Status

v1 MVP target: ~4–6 weekends. Sole author and sole user: Bartosz.
