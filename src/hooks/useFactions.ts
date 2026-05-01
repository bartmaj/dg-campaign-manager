import { useQuery } from '@tanstack/react-query'
import { getFaction, listFactions, type FactionRow } from '../api/factions'

export const factionKeys = {
  all: ['factions'] as const,
  list: () => [...factionKeys.all, 'list'] as const,
  detail: (id: string) => [...factionKeys.all, 'detail', id] as const,
}

export function useFactions() {
  return useQuery<FactionRow[]>({
    queryKey: factionKeys.list(),
    queryFn: listFactions,
  })
}

export function useFaction(id: string | undefined) {
  return useQuery<FactionRow>({
    queryKey: factionKeys.detail(id ?? ''),
    queryFn: () => getFaction(id as string),
    enabled: Boolean(id),
  })
}
