import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteClue } from '../api/clues'
import { clueKeys } from './useClues'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteClue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClue(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: clueKeys.lists() })
      qc.removeQueries({ queryKey: clueKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
