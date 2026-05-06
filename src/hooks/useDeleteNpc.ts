import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteNpc } from '../api/npcs'
import { npcKeys } from './useNpcs'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteNpc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNpc(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: npcKeys.lists() })
      qc.removeQueries({ queryKey: npcKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
