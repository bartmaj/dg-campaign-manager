import { useQuery } from '@tanstack/react-query'
import { getClue, listClues, type ClueRow } from '../api/clues'

export const clueKeys = {
  all: ['clues'] as const,
  list: () => [...clueKeys.all, 'list'] as const,
  detail: (id: string) => [...clueKeys.all, 'detail', id] as const,
}

export function useClues() {
  return useQuery<ClueRow[]>({
    queryKey: clueKeys.list(),
    queryFn: listClues,
  })
}

export function useClue(id: string | undefined) {
  return useQuery<ClueRow>({
    queryKey: clueKeys.detail(id ?? ''),
    queryFn: () => getClue(id as string),
    enabled: Boolean(id),
  })
}
