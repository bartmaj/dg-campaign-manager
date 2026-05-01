import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ItemInput } from '../../domain/item'
import { createItem, type ItemRow } from '../api/items'
import { itemKeys } from './useItems'
import { searchIndexQueryKey } from './useSearchIndex'

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation<ItemRow, Error, ItemInput>({
    mutationFn: createItem,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      qc.setQueryData(itemKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
