import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateLocation, type LocationPatch, type LocationRow } from '../api/locations'
import { locationKeys } from './useLocations'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: LocationPatch }

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation<LocationRow, Error, Args>({
    mutationFn: ({ id, patch }) => updateLocation(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(locationKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
