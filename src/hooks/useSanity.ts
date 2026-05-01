import { useQuery } from '@tanstack/react-query'
import { listSanEvents, type SanChangeEvent } from '../api/sanity'

export const sanityKeys = {
  all: ['sanity'] as const,
  events: (pcId: string) => [...sanityKeys.all, 'events', pcId] as const,
}

export function useSanEvents(pcId: string | undefined) {
  return useQuery<SanChangeEvent[]>({
    queryKey: sanityKeys.events(pcId ?? ''),
    queryFn: () => listSanEvents(pcId as string),
    enabled: Boolean(pcId),
  })
}
