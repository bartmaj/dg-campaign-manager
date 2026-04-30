---
id: 024
title: Implement the play-mode primary actions toolbar
milestone: M3
unit: M3 — Campaign-Run-Ready
status: not-started
labels: [ui]
req-ids: [REQ-020, REQ-N07]
---

# Implement the play-mode primary actions toolbar

## Narrative
**As** the GM at the Table
**I want** five one-click/keystroke actions in play mode
**So that** at-table mutations never require a deep navigation

## Acceptance Criteria

```gherkin
Given play mode on any page
When I trigger any of: open Cmd-K, mark clue delivered, log SAN change, log Bond damage, jump to current Session
Then the action completes in 1 click or 1 keyboard shortcut
And every shortcut is documented in a "?" overlay
```

## REQ Traceability
- REQ-020 — Play-mode primary actions (Cmd-K, mark clue delivered, log SAN, log Bond damage, jump to Session — <=1 click/keystroke)
- REQ-N07 — Keyboard-first play mode (keyboard-driven navigation for the five primary actions)

## Implementation Notes

Hotkey layer via react-hotkeys-hook; shortcuts overlay is a global modal.

## Dependencies

Blocked by #023, #016, #011, #012.
