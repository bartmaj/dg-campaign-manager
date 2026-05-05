import { useQuery } from '@tanstack/react-query'
import type { EntityType } from '../../db/schema'
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

/**
 * Recent-activity helper: lists sessions whose timeline references this
 * entity (via edges, bond_damage_events, or san_change_events). Powers
 * the EntityRecentActivity card on detail pages.
 */
export function useSessionsInvolving(type: EntityType, id: string | undefined) {
  const filter: SessionFilter = id ? { involvesType: type, involvesId: id } : {}
  return useQuery<SessionRow[]>({
    queryKey: sessionKeys.list('realWorld', filter),
    queryFn: () => listSessions('realWorld', filter),
    enabled: Boolean(id),
  })
}

export function useSession(id: string | undefined) {
  return useQuery<SessionRow>({
    queryKey: sessionKeys.detail(id ?? ''),
    queryFn: () => getSession(id as string),
    enabled: Boolean(id),
  })
}
