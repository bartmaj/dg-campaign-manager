// Prep/Play mode source of truth. Mode is purely client-side; the API is
// mode-agnostic. The mode is reflected in the URL (?mode=play|prep) and
// persisted in localStorage under the key `dg.mode`. The provider must be
// mounted inside the router so it can use `useSearchParams`.

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'

export type AppMode = 'prep' | 'play'

const STORAGE_KEY = 'dg.mode'
const URL_PARAM = 'mode'

type AppModeContextValue = {
  mode: AppMode
  setMode: (next: AppMode) => void
}

const AppModeContext = createContext<AppModeContextValue | null>(null)

function isAppMode(value: string | null | undefined): value is AppMode {
  return value === 'prep' || value === 'play'
}

function readStoredMode(): AppMode | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return isAppMode(v) ? v : null
  } catch {
    return null
  }
}

function writeStoredMode(mode: AppMode): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Ignore storage errors (e.g. private mode quotas).
  }
}

type Props = {
  children: ReactNode
}

export function AppModeProvider({ children }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlMode = searchParams.get(URL_PARAM)
  const effectiveMode: AppMode = isAppMode(urlMode) ? urlMode : (readStoredMode() ?? 'prep')

  // On first mount, if URL has no mode but storage does (or default differs),
  // reflect the resolved mode in the URL so refresh/share preserves it.
  useEffect(() => {
    if (urlMode === null) {
      const stored = readStoredMode()
      if (stored && stored !== 'prep') {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set(URL_PARAM, stored)
            return next
          },
          { replace: true },
        )
      }
    } else if (!isAppMode(urlMode)) {
      // Strip an invalid value.
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete(URL_PARAM)
          return next
        },
        { replace: true },
      )
    }
    // We only want this to run on mount; subsequent changes are handled by setMode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep localStorage in sync whenever the URL-resolved mode changes
  // (covers back/forward navigation and manual URL edits).
  useEffect(() => {
    writeStoredMode(effectiveMode)
  }, [effectiveMode])

  const setMode = useCallback(
    (next: AppMode) => {
      writeStoredMode(next)
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === 'prep') {
            // Keep URLs tidy: prep is the default, no need to advertise it.
            params.delete(URL_PARAM)
          } else {
            params.set(URL_PARAM, next)
          }
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const value = useMemo<AppModeContextValue>(
    () => ({ mode: effectiveMode, setMode }),
    [effectiveMode, setMode],
  )

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext)
  if (!ctx) {
    throw new Error('useAppMode must be used within an AppModeProvider')
  }
  return ctx
}

// `useIsPlayMode` is the wrap-it-and-forget read path used by `EditOnly` and
// any other read sites. When called outside an `AppModeProvider` (e.g. in
// isolated component tests that don't mount Layout), default to `false` —
// i.e. behave like prep mode. This keeps the primitive boring and reliable.
// eslint-disable-next-line react-refresh/only-export-components
export function useIsPlayMode(): boolean {
  const ctx = useContext(AppModeContext)
  return ctx?.mode === 'play'
}
