import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ClueInput } from '../../domain/clue'
import { createClue, type ClueRow } from '../api/clues'
import { clueKeys } from './useClues'

export function useCreateClue() {
  const qc = useQueryClient()
  return useMutation<ClueRow, Error, ClueInput>({
    mutationFn: createClue,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: clueKeys.list() })
      qc.setQueryData(clueKeys.detail(row.id), row)
    },
  })
}
