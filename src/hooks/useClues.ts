import { useQuery } from '@tanstack/react-query'
import { getClue, listClues, type ClueFilter, type ClueRow } from '../api/clues'

export const clueKeys = {
  all: ['clues'] as const,
  lists: () => [...clueKeys.all, 'list'] as const,
  list: (filter?: ClueFilter) => [...clueKeys.lists(), filter ?? {}] as const,
  detail: (id: string) => [...clueKeys.all, 'detail', id] as const,
}

export function useClues(filter?: ClueFilter) {
  return useQuery<ClueRow[]>({
    queryKey: clueKeys.list(filter),
    queryFn: () => listClues(filter ?? {}),
  })
}

export function useClue(id: string | undefined) {
  return useQuery<ClueRow>({
    queryKey: clueKeys.detail(id ?? ''),
    queryFn: () => getClue(id as string),
    enabled: Boolean(id),
  })
}
