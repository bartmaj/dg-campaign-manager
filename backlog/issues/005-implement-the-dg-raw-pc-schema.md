---
id: 005
title: Implement the DG RAW PC schema
milestone: M1
unit: M1 — Foundation
status: done
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

**Delivered**:
- DG RAW domain module (`domain/pc.ts`) with `deriveAttributes` + Zod schemas. Pure TS, no DB/UI deps (per ADR-005). HP/WP/SAN max/BP per Handler's Guide.
- `pcs` table extended (migration `drizzle/0002_aromatic_jazinda.sql`): profession, 6 stats, 4 derived attrs, skills JSON, motivations JSON, backstory_hooks, sanity_current/disorders/breaking_points stubs.
- Vercel Function endpoints in `api/pcs/index.ts` (GET list / POST create) and `api/pcs/[id].ts` (GET by id) with `@vercel/node` types.
- TanStack Query data layer: `src/lib/queryClient.ts`, `src/api/pcs.ts` typed wrappers, `src/hooks/usePcs.ts` + `useCreatePc.ts`. App wrapped in `QueryClientProvider` in `main.tsx`.
- Pages: `PcListPage`, `NewPcPage` (manual zod safeParse + react-hook-form), `PcDetailPage`. Router updated; other entities still on `EntityStubPage`.
- 12 new tests (3 → 15): `domain/pc.test.ts` covers derive functions, range validation, Zod schemas; `NewPcPage.test.tsx` covers form render + derived HP recompute.

**Open follow-ups**:
- Skills UX is a JSON textarea — refined in #007 (skill-package presets).
- API doesn't yet support PUT/PATCH/DELETE — needed for edit flows; expected in subsequent issues.
- No integration tests against `vercel dev` — domain logic is well-tested; thin handlers for now.
- Migration was applied to Turso prod as part of the agent's run.

## Dependencies

Blocked by #004.
