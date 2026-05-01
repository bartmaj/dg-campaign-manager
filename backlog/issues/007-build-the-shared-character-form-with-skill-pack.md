---
id: 007
title: Build the shared character form with skill-package presets
milestone: M1
unit: M1 — Foundation
status: done
labels: [ui, domain]
req-ids: [REQ-008]
---

# Build the shared character form with skill-package presets

## Narrative
**As** the Prepping GM
**I want** PC and NPC to share one editor with profession/skill-package presets
**So that** generating a Federal Agent NPC takes seconds, not minutes

## Acceptance Criteria

```gherkin
Given the character form
When I select profession "Federal Agent"
Then DG RAW skill-package skill values are pre-filled
And every field remains manually editable
And the same form serves both PC and NPC creation
```

## REQ Traceability
- REQ-008 — Character form with skill-package presets (PC and NPC share one editor; profession presets pre-fill skills; manual override always available)

## Implementation Notes

Skill-package data lives in the domain module as a typed constant (decision deferred per Tech Spec open items).

**Delivered**:
- `domain/skillPackages.ts` — 18 Agent's Handbook professions (Federal Agent canonical, others tagged `// TODO(verify)` for printed-source double-check), `DG_SKILL_NAMES` master list, `getSkillPackage`, `applySkillPackage`.
- `src/components/CharacterForm/CharacterForm.tsx` — shared between PC and NPC create flows. Profession select pre-fills skills via `setValue('skills', applySkillPackage(profession))`. Skills row editor uses react-hook-form's `useFieldArray` (replaces the JSON-textarea hack). Conditional fields based on `kind`: PC sees motivations/backstory/SAN stubs; NPC sees status/RP-hooks/simplified-vs-full toggle. Derived attrs recompute live via `useWatch` + `domain/pc.ts#deriveAttributes`.
- `src/pages/pcs/NewPcPage.tsx` and `src/pages/npcs/NewNpcPage.tsx` swap their inline forms for `<CharacterForm kind={…} onSubmit={…} />`. Validation pattern preserved: caller's `onSubmit` runs `pcInputSchema.safeParse` / `npcInputSchema.safeParse`.
- Tests: 27 → 40. 8 in `domain/skillPackages.test.ts` (package presence, mutation isolation, every package non-empty), 5 in `CharacterForm.test.tsx` (PC + NPC render, Federal Agent pre-fill, manual override doesn't reset siblings, custom-clear flow).

**Open follow-ups**:
- Cross-check `// TODO(verify)` ratings against a printed Handbook copy.
- Player-choice picker for "Foreign Language (X)", "Science (X)", "Craft (X)" specialties — currently hard-coded in packages.
- Bonus-point spending UX for Federal Agent's 10-point pool — out of scope here.
- Custom-profession free-form input is rendered alongside the dropdown unconditionally; could be conditional on the "(Custom — no preset)" option for cleaner UX.

## Dependencies

Blocked by #005, #006.
