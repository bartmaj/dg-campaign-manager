import { useQuery } from '@tanstack/react-query'
import type { EntityType } from '../../db/schema'
import { getEntityNames, type EntityNamesResponse } from '../api/names'

/**
 * Stable query key factory keyed by `(type, sortedIds)`. Sorting the id
 * list ensures distinct insertion orders share a cache entry — the
 * backend doesn't care about order either.
 */
export const entityNameKeys = {
  all: ['entityNames'] as const,
  byType: (type: EntityType) => [...entityNameKeys.all, type] as const,
  list: (type: EntityType, sortedIds: string[]) =>
    [...entityNameKeys.byType(type), sortedIds.join(',')] as const,
}

export function useEntityNames(type: EntityType, ids: readonly string[]) {
  const sortedIds = [...new Set(ids)].sort()
  return useQuery<EntityNamesResponse>({
    queryKey: entityNameKeys.list(type, sortedIds),
    queryFn: () => getEntityNames(type, sortedIds),
    enabled: sortedIds.length > 0,
  })
}
