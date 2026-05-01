import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SessionInput } from '../../domain/session'
import { createSession, type SessionRow } from '../api/sessions'
import { sessionKeys } from './useSessions'
import { searchIndexQueryKey } from './useSearchIndex'

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation<SessionRow, Error, SessionInput>({
    mutationFn: createSession,
    onSuccess: (row) => {
      // Invalidate both ordering variants so either list view sees the new row.
      qc.invalidateQueries({ queryKey: sessionKeys.lists() })
      qc.setQueryData(sessionKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
