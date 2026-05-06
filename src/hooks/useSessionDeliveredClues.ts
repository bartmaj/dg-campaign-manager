import { useQuery } from '@tanstack/react-query'
import { getSessionDeliveredClues, type DeliveredClueRow } from '../api/sessions'

export const sessionDeliveredCluesKeys = {
  all: ['sessionDeliveredClues'] as const,
  detail: (sessionId: string) => [...sessionDeliveredCluesKeys.all, sessionId] as const,
}

export function useSessionDeliveredClues(sessionId: string | undefined) {
  return useQuery<{ items: DeliveredClueRow[] }>({
    queryKey: sessionDeliveredCluesKeys.detail(sessionId ?? ''),
    queryFn: () => getSessionDeliveredClues(sessionId as string),
    enabled: Boolean(sessionId),
  })
}
