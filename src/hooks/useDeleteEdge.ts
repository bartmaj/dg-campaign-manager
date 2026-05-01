import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteEdge, type EdgeRow } from '../api/edges'
import { edgeKeys } from './useEdges'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteEdge() {
  const qc = useQueryClient()
  return useMutation<EdgeRow, Error, string>({
    mutationFn: deleteEdge,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: edgeKeys.lists() })
      qc.removeQueries({ queryKey: edgeKeys.detail(row.id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
