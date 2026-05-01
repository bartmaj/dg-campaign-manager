import { useQuery } from '@tanstack/react-query'
import { getLocation, listLocations, type LocationRow } from '../api/locations'

export const locationKeys = {
  all: ['locations'] as const,
  list: () => [...locationKeys.all, 'list'] as const,
  detail: (id: string) => [...locationKeys.all, 'detail', id] as const,
}

export function useLocations() {
  return useQuery<LocationRow[]>({
    queryKey: locationKeys.list(),
    queryFn: listLocations,
  })
}

export function useLocation(id: string | undefined) {
  return useQuery<LocationRow>({
    queryKey: locationKeys.detail(id ?? ''),
    queryFn: () => getLocation(id as string),
    enabled: Boolean(id),
  })
}
