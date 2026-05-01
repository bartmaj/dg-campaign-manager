import { useQuery } from '@tanstack/react-query'
import { getNpc, listNpcs, type NpcRow } from '../api/npcs'

export const npcKeys = {
  all: ['npcs'] as const,
  list: () => [...npcKeys.all, 'list'] as const,
  detail: (id: string) => [...npcKeys.all, 'detail', id] as const,
}

export function useNpcs() {
  return useQuery<NpcRow[]>({
    queryKey: npcKeys.list(),
    queryFn: listNpcs,
  })
}

export function useNpc(id: string | undefined) {
  return useQuery<NpcRow>({
    queryKey: npcKeys.detail(id ?? ''),
    queryFn: () => getNpc(id as string),
    enabled: Boolean(id),
  })
}
