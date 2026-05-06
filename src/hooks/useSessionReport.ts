import { useQuery } from '@tanstack/react-query'
import { getSessionReport, type SessionReport } from '../api/sessions'

/**
 * Query keys for the auto-derived session report (#027). The report is the
 * server-side aggregation of clue/NPC/bond/SAN events tagged with this
 * session id. Mutations that stamp `sessionId` should invalidate
 * `sessionReportKeys.detail(sessionId)` so the report card refreshes.
 */
export const sessionReportKeys = {
  all: ['sessionReport'] as const,
  detail: (sessionId: string) => [...sessionReportKeys.all, sessionId] as const,
}

export function useSessionReport(sessionId: string | undefined) {
  return useQuery<SessionReport>({
    queryKey: sessionReportKeys.detail(sessionId ?? ''),
    queryFn: () => getSessionReport(sessionId as string),
    enabled: Boolean(sessionId),
  })
}
