import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LocationInput } from '../../domain/location'
import { createLocation, type LocationRow } from '../api/locations'
import { locationKeys } from './useLocations'
import { searchIndexQueryKey } from './useSearchIndex'

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation<LocationRow, Error, LocationInput>({
    mutationFn: createLocation,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      qc.setQueryData(locationKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
