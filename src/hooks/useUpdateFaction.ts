import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFaction, type FactionPatch, type FactionRow } from '../api/factions'
import { factionKeys } from './useFactions'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: FactionPatch }

export function useUpdateFaction() {
  const qc = useQueryClient()
  return useMutation<FactionRow, Error, Args>({
    mutationFn: ({ id, patch }) => updateFaction(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(factionKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: factionKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
