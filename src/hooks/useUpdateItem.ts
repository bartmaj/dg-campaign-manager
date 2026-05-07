import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateItem, type ItemPatch, type ItemRow } from '../api/items'
import { itemKeys } from './useItems'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: ItemPatch }

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation<ItemRow, Error, Args>({
    mutationFn: ({ id, patch }) => updateItem(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(itemKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
