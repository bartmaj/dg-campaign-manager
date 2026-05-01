import { useQuery } from '@tanstack/react-query'
import { getSession, listSessions, type SessionOrderBy, type SessionRow } from '../api/sessions'

export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (orderBy: SessionOrderBy) => [...sessionKeys.lists(), orderBy] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
}

export function useSessions(orderBy: SessionOrderBy = 'realWorld') {
  return useQuery<SessionRow[]>({
    queryKey: sessionKeys.list(orderBy),
    queryFn: () => listSessions(orderBy),
  })
}

export function useSession(id: string | undefined) {
  return useQuery<SessionRow>({
    queryKey: sessionKeys.detail(id ?? ''),
    queryFn: () => getSession(id as string),
    enabled: Boolean(id),
  })
}
