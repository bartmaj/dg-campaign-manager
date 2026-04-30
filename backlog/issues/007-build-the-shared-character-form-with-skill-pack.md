---
id: 007
title: Build the shared character form with skill-package presets
milestone: M1
unit: M1 — Foundation
status: not-started
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

## Dependencies

Blocked by #005, #006.
