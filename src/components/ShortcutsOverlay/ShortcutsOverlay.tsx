// Shortcuts help overlay (#024). Listens for `?` to open and Esc to
// close, plus exposes a header IconButton that toggles it.
//
// The list is duplicated here from PlayActionsToolbar's hotkey
// registrations — that's intentional. The overlay is documentation; the
// actual hotkey registrations live with the actions they bind.

import { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import Card from '../ui/Card'
import IconButton from '../ui/IconButton'
import KbdHint from '../ui/KbdHint'
import Heading from '../ui/Heading'
import Stack from '../ui/Stack'

type Shortcut = { keys: string; label: string }

const SHORTCUTS: readonly Shortcut[] = [
  { keys: 'Cmd/Ctrl-K', label: 'Cmd-K palette' },
  { keys: 'K', label: 'Cmd-K palette (play mode)' },
  { keys: 'D', label: 'Mark clue delivered (play mode)' },
  { keys: 'S', label: 'Log SAN change (play mode)' },
  { keys: 'B', label: 'Log Bond damage (play mode)' },
  { keys: 'E', label: 'Encounter NPC (play mode)' },
  { keys: 'J', label: 'Jump to current session (play mode)' },
  { keys: '?', label: 'Open this shortcuts overlay' },
  { keys: 'Esc', label: 'Close popover/modal' },
]

export function ShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false)

  // `?` opens the overlay everywhere (not gated to play mode); the lib's
  // default ignores keypresses inside form elements so users typing in
  // a search box won't trigger it.
  // Match the literal `?` produced by the user (Shift+/ on US, plain
  // `?` on Polish/AZERTY/etc.). `useKey: true` makes the hook compare
  // `event.key` directly, which is layout-correct for printable chars.
  useHotkeys('?', () => setIsOpen(true), { useKey: true })

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  return (
    <>
      <IconButton aria-label="Show keyboard shortcuts" onClick={() => setIsOpen(true)}>
        ?
      </IconButton>
      {isOpen && <ShortcutsModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/45 pt-[12vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="w-[min(520px,92vw)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <Stack gap="sm">
            <Heading level={2}>Keyboard shortcuts</Heading>
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
              {SHORTCUTS.map((s) => (
                <li key={s.keys} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink">{s.label}</span>
                  <KbdHint>{s.keys}</KbdHint>
                </li>
              ))}
            </ul>
          </Stack>
        </Card>
      </div>
    </div>
  )
}

export default ShortcutsOverlay
