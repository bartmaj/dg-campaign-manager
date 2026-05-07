import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchSession, type SessionPatch, type SessionRow } from '../api/sessions'
import { searchIndexQueryKey } from './useSearchIndex'
import { sessionKeys } from './useSessions'

type Args = { id: string; patch: SessionPatch }

/**
 * Edit-form sibling of `usePatchSession`. Same wire path; different
 * invalidation set — we also touch the search index in case `name`
 * changed.
 */
export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation<SessionRow, Error, Args>({
    mutationFn: ({ id, patch }) => patchSession(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(sessionKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: sessionKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
