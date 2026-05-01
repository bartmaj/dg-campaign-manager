import { useQuery } from '@tanstack/react-query'
import { getFaction, listFactions, type FactionFilter, type FactionRow } from '../api/factions'

export const factionKeys = {
  all: ['factions'] as const,
  lists: () => [...factionKeys.all, 'list'] as const,
  list: (filter?: FactionFilter) => [...factionKeys.lists(), filter ?? {}] as const,
  detail: (id: string) => [...factionKeys.all, 'detail', id] as const,
}

export function useFactions(filter?: FactionFilter) {
  return useQuery<FactionRow[]>({
    queryKey: factionKeys.list(filter),
    queryFn: () => listFactions(filter ?? {}),
  })
}

export function useFaction(id: string | undefined) {
  return useQuery<FactionRow>({
    queryKey: factionKeys.detail(id ?? ''),
    queryFn: () => getFaction(id as string),
    enabled: Boolean(id),
  })
}
