import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePc, type PcPatch, type PcRow } from '../api/pcs'
import { pcKeys } from './usePcs'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: PcPatch }

export function useUpdatePc() {
  const qc = useQueryClient()
  return useMutation<PcRow, Error, Args>({
    mutationFn: ({ id, patch }) => updatePc(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(pcKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: pcKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
