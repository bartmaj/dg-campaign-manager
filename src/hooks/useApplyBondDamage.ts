import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BondDamageInput } from '../../domain/bonds'
import { applyBondDamage, type BondDamageEvent, type BondRow } from '../api/bonds'
import { bondKeys } from './useBonds'

type Args = { bondId: string; input: BondDamageInput }

export function useApplyBondDamage() {
  const qc = useQueryClient()
  return useMutation<{ bond: BondRow; event: BondDamageEvent }, Error, Args>({
    mutationFn: ({ bondId, input }) => applyBondDamage(bondId, input),
    onSuccess: ({ bond }) => {
      // Refresh the per-id detail (events list changed) and any list view
      // that includes this bond — pcId filter and reverse-target filter.
      qc.invalidateQueries({ queryKey: bondKeys.detail(bond.id) })
      qc.invalidateQueries({ queryKey: bondKeys.lists() })
    },
  })
}
