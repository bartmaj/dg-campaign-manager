---
id: 024
title: Implement the play-mode primary actions toolbar
milestone: M3
unit: M3 — Campaign-Run-Ready
status: done
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

**Delivered**:
- `react-hotkeys-hook@5.3.2` installed.
- `src/lib/currentSession.ts` — `useCurrentSessionId()` localStorage-backed (`dg.currentSessionId`) with cross-instance sync via `useSyncExternalStore`. `SessionDetailPage` gets a "Set as current session" / "Stop tracking" + Current-session Badge control.
- `src/components/PlayActionsToolbar/PlayActionsToolbar.tsx` — sticky bottom-right, play-mode-gated. 5 buttons (Cmd-K, Mark clue delivered `D`, Log SAN `S`, Log Bond damage `B`, Jump to current session `J`) with KbdHints. Each button has a popover composed from primitives, closing on Esc. Hotkeys gated on `isPlayMode && !editable-focus`.
- `src/components/CmdK/openPalette.ts` — tiny event bus so the toolbar can open Cmd-K without coupling to its hook.
- `src/components/ShortcutsOverlay/ShortcutsOverlay.tsx` — `?` opens a Card-based modal listing every shortcut. IconButton in the header opens the same modal in any mode.
- `bondsList` returns all bonds (cap 500) when no filter present so the Bond-damage popover can populate.
- Tests: 271 → 280 (+9).

**Open follow-ups**:
- **#025 — full clue-delivery flow**: replace the raw `clue→scene 'delivered_in'` edge created in the popover with a proper delivery state machine. Marked TODO(#025) in code.
- Surface bond/SAN events filtered by sessionId on `SessionDetailPage` (existing #013 follow-up).
- Hotkey conflict registry if more letter shortcuts arrive.

## Dependencies

Blocked by #023, #016, #011, #012.
