import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFactionStatus,
  deleteFactionStatus,
  listFactionStatus,
  type FactionStatusEvent,
  type FactionStatusInput,
} from '../api/factionStatus'
import { searchIndexQueryKey } from './useSearchIndex'

export const factionStatusKeys = {
  all: ['factionStatus'] as const,
  lists: () => [...factionStatusKeys.all, 'list'] as const,
  list: (factionId: string) => [...factionStatusKeys.lists(), factionId] as const,
}

export function useFactionStatus(factionId: string | undefined) {
  return useQuery<FactionStatusEvent[]>({
    queryKey: factionStatusKeys.list(factionId ?? ''),
    queryFn: () => listFactionStatus(factionId as string),
    enabled: Boolean(factionId),
  })
}

export function useCreateFactionStatus() {
  const qc = useQueryClient()
  return useMutation<FactionStatusEvent, Error, FactionStatusInput>({
    mutationFn: createFactionStatus,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: factionStatusKeys.list(row.factionId) })
      // Status events themselves don't surface in the search index, but we
      // keep the convention from #016 so any aggregated faction-level
      // search field stays fresh.
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}

export function useDeleteFactionStatus(factionId: string) {
  const qc = useQueryClient()
  return useMutation<FactionStatusEvent, Error, string>({
    mutationFn: deleteFactionStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: factionStatusKeys.list(factionId) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
