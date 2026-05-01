import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NpcInput } from '../../domain/npc'
import { createNpc, type NpcRow } from '../api/npcs'
import { npcKeys } from './useNpcs'
import { searchIndexQueryKey } from './useSearchIndex'

export function useCreateNpc() {
  const qc = useQueryClient()
  return useMutation<NpcRow, Error, NpcInput>({
    mutationFn: createNpc,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: npcKeys.lists() })
      qc.setQueryData(npcKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
