// Current-session tracking. The "current session" is the session the GM
// is running right now — set from SessionDetailPage and read by the
// play-mode primary actions toolbar (#024) so the "Jump to current
// session" action and event-stamping (SAN/Bond damage) can target it.
//
// Persisted in localStorage under `dg.currentSessionId`; synchronized
// across hook instances in the same tab via a tiny event emitter and
// `useSyncExternalStore`.

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'dg.currentSessionId'

type Listener = () => void
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function read(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function getServerSnapshot(): string | null {
  return null
}

function write(value: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Ignore storage errors (e.g. quota exceeded in private mode).
  }
}

export type CurrentSessionHook = {
  value: string | null
  set: (id: string | null) => void
}

export function useCurrentSessionId(): CurrentSessionHook {
  const value = useSyncExternalStore(subscribe, read, getServerSnapshot)
  const set = useCallback((id: string | null) => {
    write(id)
    emit()
  }, [])
  return { value, set }
}

// Test-only helper. Public so isolated component tests can reset state.
export function __resetCurrentSessionForTests(): void {
  write(null)
  emit()
}
