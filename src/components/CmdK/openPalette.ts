// Tiny event bus for "open the Cmd-K palette" requests from places
// other than the global keyboard shortcut — e.g. the play-mode primary
// actions toolbar (#024) and any "?" overlay shortcut entry.
//
// The palette subscribes once on mount and the toolbar publishes via
// `requestOpenPalette()`. Kept dependency-free so it can be imported
// from anywhere without touching React Context.

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeOpenPalette(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function requestOpenPalette(): void {
  for (const l of listeners) l()
}
