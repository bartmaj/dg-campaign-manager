import { useQuery } from '@tanstack/react-query'
import type { EntityType } from '../../db/schema'
import { getEdge, listEdges, type EdgeFilter, type EdgeRow } from '../api/edges'

/**
 * Stable query key factory for edges. The `list` key includes the filter
 * object so distinct filters get distinct cache entries.
 */
export const edgeKeys = {
  all: ['edges'] as const,
  lists: () => [...edgeKeys.all, 'list'] as const,
  list: (filter: EdgeFilter) => [...edgeKeys.lists(), filter] as const,
  detail: (id: string) => [...edgeKeys.all, 'detail', id] as const,
}

export function useEdges(filter: EdgeFilter) {
  return useQuery<EdgeRow[]>({
    queryKey: edgeKeys.list(filter),
    queryFn: () => listEdges(filter),
  })
}

export function useEdge(id: string | undefined) {
  return useQuery<EdgeRow>({
    queryKey: edgeKeys.detail(id ?? ''),
    queryFn: () => getEdge(id as string),
    enabled: Boolean(id),
  })
}

/**
 * Convenience: every edge pointing AT (targetType, targetId) — the
 * reverse-ref lookup that powers "Implicating clues" / "Linked items"
 * sections on entity detail pages.
 */
export function useIncomingEdges(targetType: EntityType, targetId: string | undefined) {
  return useQuery<EdgeRow[]>({
    queryKey: edgeKeys.list({ targetType, targetId: targetId ?? '' }),
    queryFn: () => listEdges({ targetType, targetId: targetId as string }),
    enabled: Boolean(targetId),
  })
}

/**
 * Convenience: every edge originating FROM (sourceType, sourceId).
 */
export function useOutgoingEdges(sourceType: EntityType, sourceId: string | undefined) {
  return useQuery<EdgeRow[]>({
    queryKey: edgeKeys.list({ sourceType, sourceId: sourceId ?? '' }),
    queryFn: () => listEdges({ sourceType, sourceId: sourceId as string }),
    enabled: Boolean(sourceId),
  })
}
