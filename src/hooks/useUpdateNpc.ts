import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateNpc, type NpcPatch, type NpcRow } from '../api/npcs'
import { npcKeys } from './useNpcs'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: NpcPatch }

export function useUpdateNpc() {
  const qc = useQueryClient()
  return useMutation<NpcRow, Error, Args>({
    mutationFn: ({ id, patch }) => updateNpc(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(npcKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: npcKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
