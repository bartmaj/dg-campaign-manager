import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchSession, type SessionPatch, type SessionRow } from '../api/sessions'
import { sessionKeys } from './useSessions'

type Args = { id: string; patch: SessionPatch }

/**
 * Patch a session (notes / description / name). Invalidates the per-session
 * detail query so the page picks up the new value. Lists are also
 * invalidated when `name` changes — cheap since session lists are small.
 */
export function usePatchSession() {
  const qc = useQueryClient()
  return useMutation<SessionRow, Error, Args>({
    mutationFn: ({ id, patch }) => patchSession(id, patch),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: sessionKeys.detail(row.id) })
      qc.invalidateQueries({ queryKey: sessionKeys.lists() })
    },
  })
}
