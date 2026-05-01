import { useQuery } from '@tanstack/react-query'
import { getItem, listItems, type ItemFilter, type ItemRow } from '../api/items'

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filter?: ItemFilter) => [...itemKeys.lists(), filter ?? {}] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
}

export function useItems(filter?: ItemFilter) {
  return useQuery<ItemRow[]>({
    queryKey: itemKeys.list(filter),
    queryFn: () => listItems(filter ?? {}),
  })
}

export function useItem(id: string | undefined) {
  return useQuery<ItemRow>({
    queryKey: itemKeys.detail(id ?? ''),
    queryFn: () => getItem(id as string),
    enabled: Boolean(id),
  })
}
