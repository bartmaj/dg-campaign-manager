# Cross-browser smoke checklist

Manual pass. Run before any campaign session whose tooling matters.
There is no Playwright/Selenium harness in v1 — the surface area is
small and a 10-minute manual sweep on each target catches what
matters.

## Targets (REQ-N06)

- Chrome: latest, latest-1
- Firefox: latest, latest-1
- Safari: latest, latest-1

Mobile and other browsers are explicitly out of scope.

## What to exercise

1. **Layout shell**
   - Header brand reads correctly; ⌘K hint visible.
   - Prep/Play toggle switches mode; play mode dims editing affordances and surfaces the play-actions toolbar.
   - Sidebar nav links all hover-state correctly; active link is clearly distinguished.
   - "?" overlay opens via header IconButton AND the `?` hotkey.

2. **Cmd-K palette** (#016)
   - Cmd-K (or Ctrl-K) opens.
   - Type 3+ characters; results render with type chip + name + matched-range highlight + subtitle.
   - Arrow keys navigate; Enter activates; Esc closes.

3. **List + filter** (#017)
   - Open NPCs list; faction filter dropdown narrows the list.
   - Open Clues list; originScenarioId filter narrows the list.
   - Free-text `q` filter on at least 3 entity types.

4. **Character form** (#005, #007)
   - PC create form: profession select pre-fills skills (try Federal Agent).
   - Stats inputs accept 1–18; derived attrs live-update.
   - Save and round-trip via the detail page.

5. **MD scenario import** (#014)
   - Paste the sample markdown from `docs/md-import-template.md` into the Import page.
   - Successful import lands on a populated scenario.
   - Pasted invalid input shows line-and-field errors.

6. **Play-mode primary actions** (#024, #025, #026)
   - Set a current session via `SessionDetailPage`.
   - Toggle play mode.
   - Hotkeys K/D/S/B/J/E open the corresponding popovers.
   - Mark a clue delivered → confirm it shows on the clue detail page's Delivery card AND the session's Event log.
   - Log a SAN change → confirm it shows on the PC's Sanity history AND the session Event log.
   - Log a Bond damage → ditto.
   - Encounter an NPC → confirm it shows on the NPC's encounter history AND the session Event log.

7. **Session report** (#027)
   - Open a session detail page; the Event log renders chronologically.
   - Save a freeform note; reload; the note persists.
   - Save a player note; download the handout (#028); confirm only the player note + delivered clues + encountered NPCs (names only) + locations are in the file. **No** secrets, mannerisms, SAN/Bond mechanics in the handout.

8. **Per-entity export + archive** (#015, #029)
   - Download MD on at least one detail page; open the file; verify it parses by eye.
   - Visit `/archive`; download the ZIP; confirm one file per entity row plus a README + index.

## Sign-off

After exercising the above on a target browser, append:

```
YYYY-MM-DD — Chrome 142.x — passed (notes: …)
YYYY-MM-DD — Firefox 130.x — passed
YYYY-MM-DD — Safari 18.x — passed
```

Failures get a brief inline note + a backlog issue if the bug is real.

## Last verified

(Append entries here.)
