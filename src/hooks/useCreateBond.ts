import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BondInput } from '../../domain/bonds'
import { createBond, type BondRow } from '../api/bonds'
import { bondKeys } from './useBonds'

export function useCreateBond() {
  const qc = useQueryClient()
  return useMutation<BondRow, Error, BondInput>({
    mutationFn: createBond,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bondKeys.lists() })
    },
  })
}
