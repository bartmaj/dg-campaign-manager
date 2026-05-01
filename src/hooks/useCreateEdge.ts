import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EdgeInput } from '../../domain/edges'
import { createEdge, type EdgeRow } from '../api/edges'
import { edgeKeys } from './useEdges'
import { searchIndexQueryKey } from './useSearchIndex'

export function useCreateEdge() {
  const qc = useQueryClient()
  return useMutation<EdgeRow, Error, EdgeInput>({
    mutationFn: createEdge,
    onSuccess: (row) => {
      // Invalidate every edge list — we don't know which filter the new
      // edge belongs to without inspecting consumers, and edge lists are
      // cheap to refetch.
      qc.invalidateQueries({ queryKey: edgeKeys.lists() })
      qc.setQueryData(edgeKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
