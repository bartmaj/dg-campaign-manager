import { useQuery } from '@tanstack/react-query'
import {
  getSession,
  listSessions,
  type SessionFilter,
  type SessionOrderBy,
  type SessionRow,
} from '../api/sessions'

export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (orderBy: SessionOrderBy, filter?: SessionFilter) =>
    [...sessionKeys.lists(), orderBy, filter ?? {}] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
}

export function useSessions(orderBy: SessionOrderBy = 'realWorld', filter?: SessionFilter) {
  return useQuery<SessionRow[]>({
    queryKey: sessionKeys.list(orderBy, filter),
    queryFn: () => listSessions(orderBy, filter ?? {}),
  })
}

export function useSession(id: string | undefined) {
  return useQuery<SessionRow>({
    queryKey: sessionKeys.detail(id ?? ''),
    queryFn: () => getSession(id as string),
    enabled: Boolean(id),
  })
}
