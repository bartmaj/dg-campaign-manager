import { useQuery } from '@tanstack/react-query'
import { getPc, listPcs, type PcRow } from '../api/pcs'

export const pcKeys = {
  all: ['pcs'] as const,
  list: () => [...pcKeys.all, 'list'] as const,
  detail: (id: string) => [...pcKeys.all, 'detail', id] as const,
}

export function usePcs() {
  return useQuery<PcRow[]>({
    queryKey: pcKeys.list(),
    queryFn: listPcs,
  })
}

export function usePc(id: string | undefined) {
  return useQuery<PcRow>({
    queryKey: pcKeys.detail(id ?? ''),
    queryFn: () => getPc(id as string),
    enabled: Boolean(id),
  })
}
