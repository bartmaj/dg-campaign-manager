import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteLocation } from '../api/locations'
import { locationKeys } from './useLocations'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      qc.removeQueries({ queryKey: locationKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
