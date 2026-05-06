import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteItem } from '../api/items'
import { itemKeys } from './useItems'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      qc.removeQueries({ queryKey: itemKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
