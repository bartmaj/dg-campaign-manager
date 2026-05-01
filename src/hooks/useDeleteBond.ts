import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteBond, type BondRow } from '../api/bonds'
import { bondKeys } from './useBonds'

export function useDeleteBond() {
  const qc = useQueryClient()
  return useMutation<BondRow, Error, string>({
    mutationFn: deleteBond,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: bondKeys.lists() })
      qc.removeQueries({ queryKey: bondKeys.detail(row.id) })
    },
  })
}
