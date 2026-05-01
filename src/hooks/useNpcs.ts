import { useQuery } from '@tanstack/react-query'
import { getNpc, listNpcs, type NpcFilter, type NpcRow } from '../api/npcs'

export const npcKeys = {
  all: ['npcs'] as const,
  lists: () => [...npcKeys.all, 'list'] as const,
  list: (filter?: NpcFilter) => [...npcKeys.lists(), filter ?? {}] as const,
  detail: (id: string) => [...npcKeys.all, 'detail', id] as const,
}

export function useNpcs(filter?: NpcFilter) {
  return useQuery<NpcRow[]>({
    queryKey: npcKeys.list(filter),
    queryFn: () => listNpcs(filter ?? {}),
  })
}

export function useNpc(id: string | undefined) {
  return useQuery<NpcRow>({
    queryKey: npcKeys.detail(id ?? ''),
    queryFn: () => getNpc(id as string),
    enabled: Boolean(id),
  })
}
