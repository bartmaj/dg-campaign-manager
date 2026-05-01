import { useQuery } from '@tanstack/react-query'
import { getLocation, listLocations, type LocationFilter, type LocationRow } from '../api/locations'

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (filter?: LocationFilter) => [...locationKeys.lists(), filter ?? {}] as const,
  detail: (id: string) => [...locationKeys.all, 'detail', id] as const,
}

export function useLocations(filter?: LocationFilter) {
  return useQuery<LocationRow[]>({
    queryKey: locationKeys.list(filter),
    queryFn: () => listLocations(filter ?? {}),
  })
}

export function useLocation(id: string | undefined) {
  return useQuery<LocationRow>({
    queryKey: locationKeys.detail(id ?? ''),
    queryFn: () => getLocation(id as string),
    enabled: Boolean(id),
  })
}
