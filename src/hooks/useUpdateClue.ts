import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateClue, type CluePatch, type ClueRow } from '../api/clues'
import { clueKeys } from './useClues'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: CluePatch }

export function useUpdateClue() {
  const qc = useQueryClient()
  return useMutation<ClueRow, Error, Args>({
    mutationFn: ({ id, patch }) => updateClue(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(clueKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: clueKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
