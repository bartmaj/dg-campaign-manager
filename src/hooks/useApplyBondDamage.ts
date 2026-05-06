import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BondDamageInput } from '../../domain/bonds'
import { applyBondDamage, type BondDamageEvent, type BondRow } from '../api/bonds'
import { bondKeys } from './useBonds'
import { useStampSessionId } from './usePlayModeStamp'
import { searchIndexQueryKey } from './useSearchIndex'
import { sessionKeys } from './useSessions'
import { sessionReportKeys } from './useSessionReport'

type Args = { bondId: string; input: BondDamageInput }

export function useApplyBondDamage() {
  const qc = useQueryClient()
  const stamp = useStampSessionId<BondDamageInput>()
  return useMutation<{ bond: BondRow; event: BondDamageEvent }, Error, Args>({
    mutationFn: ({ bondId, input }) => applyBondDamage(bondId, stamp(input)),
    onSuccess: ({ bond, event }) => {
      // Refresh the per-id detail (events list changed) and any list view
      // that includes this bond — pcId filter and reverse-target filter.
      qc.invalidateQueries({ queryKey: bondKeys.detail(bond.id) })
      qc.invalidateQueries({ queryKey: bondKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
      // The bond damage may have stamped a session; the session-involves
      // rollup should pick this up.
      if (event.sessionId) {
        qc.invalidateQueries({ queryKey: sessionKeys.lists() })
        qc.invalidateQueries({ queryKey: sessionReportKeys.detail(event.sessionId) })
      }
    },
  })
}
