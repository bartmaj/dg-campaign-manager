import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletePc } from '../api/pcs'
import { pcKeys } from './usePcs'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeletePc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePc(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: pcKeys.lists() })
      qc.removeQueries({ queryKey: pcKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
