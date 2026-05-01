import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ClueInput } from '../../domain/clue'
import { createClue, type ClueRow } from '../api/clues'
import { clueKeys } from './useClues'
import { searchIndexQueryKey } from './useSearchIndex'

export function useCreateClue() {
  const qc = useQueryClient()
  return useMutation<ClueRow, Error, ClueInput>({
    mutationFn: createClue,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: clueKeys.lists() })
      qc.setQueryData(clueKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
