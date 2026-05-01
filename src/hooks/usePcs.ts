import { useQuery } from '@tanstack/react-query'
import { getPc, listPcs, type PcFilter, type PcRow } from '../api/pcs'

export const pcKeys = {
  all: ['pcs'] as const,
  lists: () => [...pcKeys.all, 'list'] as const,
  list: (filter?: PcFilter) => [...pcKeys.lists(), filter ?? {}] as const,
  detail: (id: string) => [...pcKeys.all, 'detail', id] as const,
}

export function usePcs(filter?: PcFilter) {
  return useQuery<PcRow[]>({
    queryKey: pcKeys.list(filter),
    queryFn: () => listPcs(filter ?? {}),
  })
}

export function usePc(id: string | undefined) {
  return useQuery<PcRow>({
    queryKey: pcKeys.detail(id ?? ''),
    queryFn: () => getPc(id as string),
    enabled: Boolean(id),
  })
}
