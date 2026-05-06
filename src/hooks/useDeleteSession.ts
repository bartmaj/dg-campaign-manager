import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteSession } from '../api/sessions'
import { searchIndexQueryKey } from './useSearchIndex'
import { sessionKeys } from './useSessions'

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: sessionKeys.lists() })
      qc.removeQueries({ queryKey: sessionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
