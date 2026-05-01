import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PcInput } from '../../domain/pc'
import { createPc, type PcRow } from '../api/pcs'
import { pcKeys } from './usePcs'

export function useCreatePc() {
  const qc = useQueryClient()
  return useMutation<PcRow, Error, PcInput>({
    mutationFn: createPc,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: pcKeys.list() })
      qc.setQueryData(pcKeys.detail(row.id), row)
    },
  })
}
