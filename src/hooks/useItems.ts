import { useQuery } from '@tanstack/react-query'
import { getItem, listItems, type ItemRow } from '../api/items'

export const itemKeys = {
  all: ['items'] as const,
  list: () => [...itemKeys.all, 'list'] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
}

export function useItems() {
  return useQuery<ItemRow[]>({
    queryKey: itemKeys.list(),
    queryFn: listItems,
  })
}

export function useItem(id: string | undefined) {
  return useQuery<ItemRow>({
    queryKey: itemKeys.detail(id ?? ''),
    queryFn: () => getItem(id as string),
    enabled: Boolean(id),
  })
}
