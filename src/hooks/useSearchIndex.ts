import { useQuery } from '@tanstack/react-query'
import type { SearchIndexItem } from '../../domain/searchMatch'
import { getSearchIndex, type SearchIndexResponse } from '../api/search'

/**
 * Stable query key for the global search index. Exported so mutation
 * hooks across the app can invalidate it from their `onSuccess`.
 */
export const searchIndexQueryKey = ['search', 'index'] as const

/**
 * Fetches the SPA's in-memory search index. Per ADR-003, all matching
 * happens on the client; this hook just owns the cache entry.
 *
 * `staleTime: 30_000` keeps background refetches calm while the user
 * types in the palette. Mutations elsewhere invalidate the key so a
 * fresh index lands within seconds of any create/update/delete.
 */
export function useSearchIndex(): {
  items: SearchIndexItem[]
  isLoading: boolean
  error: Error | null
} {
  const q = useQuery<SearchIndexResponse, Error>({
    queryKey: searchIndexQueryKey,
    queryFn: getSearchIndex,
    staleTime: 30_000,
  })
  return {
    items: q.data?.items ?? [],
    isLoading: q.isLoading,
    error: q.error,
  }
}
