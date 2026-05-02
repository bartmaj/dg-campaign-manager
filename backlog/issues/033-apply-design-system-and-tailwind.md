---
id: 033
title: Apply design system + Tailwind across the app
milestone: M2
unit: M2 — Core Workbench
status: not-started
labels: [ui, scaffold]
req-ids: [REQ-N06]
---

# Apply design system + Tailwind across the app

## Narrative
**As** the GM at the Table
**I want** a coherent, readable, slightly noir UI consistent across every page
**So that** prep and play don't feel like editing a database admin panel

## Acceptance Criteria

```gherkin
Given any page in the app
When I look at it
Then it uses tokens from a single design system (color, spacing, type scale, radii, elevation)
And it composes typed primitive components (Button, Card, Input, Select, Textarea, Label, Field, Badge, Heading, Stack, Container, Toolbar) from src/components/ui/
And no page reaches past primitives to ad-hoc inline styles or one-off CSS classes
And the design tokens are defined in one place — swapping the theme (e.g., dark mode, alt color palette) requires touching tokens only, not pages

Given the layout shell, list pages, detail pages, forms, and the Cmd-K palette
When the design pass is complete
Then their visual structure is consistent (header bar, sidebar nav, content surface, action toolbars)
And tabular data renders with consistent type/spacing/borders
And forms have consistent label, input, helper-text, error treatments
```

## REQ Traceability
- REQ-N06 — desktop browsers (Chrome/Firefox/Safari latest two); the design must work across them. The PRD/architecture also specify Tailwind in the stack, but no prior issue installed it.

## Implementation Notes

**Modularity is the core constraint.** Pages should compose primitives, not own styling. The boundary is: pages assemble layout + behavior; primitives own visuals. Treat the design system like a swappable concern.

- Tailwind 4.x (current). Use CSS variables for tokens so a theme switch is a single root class flip.
- DG visual register: cold, bureaucratic, redacted-document feel — but legible at the table. Avoid heavy chrome; lean on type scale and white space.
- Component primitives live in `src/components/ui/`. Each is a thin typed wrapper around Tailwind classes, exposing semantic props (`variant`, `size`, etc.), not raw className passthrough.
- `src/components/Layout.tsx`, `src/pages/**/*Page.tsx`, `src/components/CmdK/*`, `src/components/CharacterForm/*`, `src/components/FilterBar/*` should all be migrated to primitives. No ad-hoc `<div className="…">` outside `src/components/ui/` and `src/components/Layout.tsx`.
- All 217 existing tests must keep passing — no behavioral changes.
- Bundle size is acceptable to grow (Tailwind's JIT is small in production); keep an eye on Vite's chunk-size warning but don't sacrifice consistency.

## Dependencies

Blocked by: none directly (touches every page, but logic is feature-complete enough through #017 to be the right baseline). Should land **before #018** so the reverse-ref UX surfaces are designed once on top of the system rather than retrofitted.

## Open follow-ups
- Dark theme as a token-only swap (post-design-system).
- Print stylesheet for the player handout export (relates to REQ-012 / #028).
- Accessibility audit (color contrast, focus rings, keyboard nav) once primitives exist — own follow-up issue.
