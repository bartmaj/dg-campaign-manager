import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClueDeliveryInput } from '../../domain/clueDelivery'
import {
  createClueDeliveryEvent,
  getClueDelivery,
  type ClueDeliveryEventRow,
  type ClueDeliveryResponse,
} from '../api/clueDelivery'
import { sessionDeliveredCluesKeys } from './useSessionDeliveredClues'
import { sessionReportKeys } from './useSessionReport'
import { useStampSessionId } from './usePlayModeStamp'

export const clueDeliveryKeys = {
  all: ['clueDelivery'] as const,
  detail: (clueId: string) => [...clueDeliveryKeys.all, clueId] as const,
}

export function useClueDelivery(clueId: string | undefined) {
  return useQuery<ClueDeliveryResponse>({
    queryKey: clueDeliveryKeys.detail(clueId ?? ''),
    queryFn: () => getClueDelivery(clueId as string),
    enabled: Boolean(clueId),
  })
}

type CreateInput = Omit<ClueDeliveryInput, 'clueId'>

/**
 * Append a clue-delivery event. In play mode + currentSession, auto-stamps
 * `sessionId` so existing call sites that already pass `sessionId`
 * continue to work unchanged (#026).
 */
export function useCreateClueDeliveryEvent(clueId: string | undefined) {
  const qc = useQueryClient()
  const stamp = useStampSessionId<CreateInput>()
  return useMutation<ClueDeliveryEventRow, Error, CreateInput>({
    mutationFn: (input) => createClueDeliveryEvent(clueId as string, stamp(input)),
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: clueDeliveryKeys.detail(event.clueId) })
      qc.invalidateQueries({
        queryKey: sessionDeliveredCluesKeys.detail(event.sessionId),
      })
      qc.invalidateQueries({ queryKey: sessionReportKeys.detail(event.sessionId) })
    },
  })
}
