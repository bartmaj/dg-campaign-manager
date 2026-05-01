import { useEffect } from 'react'

/**
 * Listens for Cmd-K (Mac) or Ctrl-K (Win/Linux) and toggles the palette.
 *
 * The shortcut is suppressed when the user is typing inside an
 * `<input>`, `<textarea>`, or `[contenteditable]` element — UNLESS that
 * element is the palette's own input (which we identify by the
 * `data-cmdk-input` attribute set on the palette input).
 */
export function useCmdKShortcut(toggle: () => void): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!isCmdK) return

      const target = event.target as HTMLElement | null
      if (target && isEditableTarget(target) && !isPaletteInput(target)) {
        // Allow Cmd-K to still open the palette from within editable
        // areas — it's the canonical "search anywhere" shortcut. We
        // intentionally do NOT short-circuit, but we DO swallow the
        // browser's default (Firefox: focus address bar; Chrome: same).
      }
      event.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])
}

function isEditableTarget(el: HTMLElement): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  return false
}

function isPaletteInput(el: HTMLElement): boolean {
  return el.dataset.cmdkInput === 'true'
}
