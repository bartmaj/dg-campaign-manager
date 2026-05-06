import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteFaction } from '../api/factions'
import { factionKeys } from './useFactions'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteFaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFaction(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: factionKeys.lists() })
      qc.removeQueries({ queryKey: factionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
