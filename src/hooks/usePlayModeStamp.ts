// Auto-stamping helper for session-aware mutations (#026).
//
// When the GM is in play mode AND a current session is set, mutations that
// accept an optional `sessionId` should auto-fill it. Caller-supplied
// sessionId always wins (explicit > implicit). Outside play mode, or with
// no current session, the input is returned unchanged.
//
// React rules of hooks: this is a hook because it reads context + the
// external store. Call it at the top of a mutation factory and stamp
// inside `mutationFn`.

import { useCurrentSessionId } from '../lib/currentSession'
import { useIsPlayMode } from '../lib/mode'

export type SessionAwareInput = {
  sessionId?: string | null | undefined
}

/**
 * Returns a function that adds `sessionId` to the input when:
 *   - The app is in play mode, AND
 *   - A current session is set, AND
 *   - The caller has not already provided a non-null sessionId.
 *
 * Otherwise the input flows through unchanged.
 */
export function useStampSessionId<T extends SessionAwareInput>(): (input: T) => T {
  const isPlayMode = useIsPlayMode()
  const { value: currentSessionId } = useCurrentSessionId()
  return (input: T): T => {
    if (!isPlayMode) return input
    if (!currentSessionId) return input
    // Explicit caller value wins (only inject when missing/undefined; null
    // is treated as "explicitly cleared").
    if (input.sessionId !== undefined) return input
    return { ...input, sessionId: currentSessionId }
  }
}
