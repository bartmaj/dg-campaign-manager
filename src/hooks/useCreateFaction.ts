import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FactionInput } from '../../domain/faction'
import { createFaction, type FactionRow } from '../api/factions'
import { factionKeys } from './useFactions'

export function useCreateFaction() {
  const qc = useQueryClient()
  return useMutation<FactionRow, Error, FactionInput>({
    mutationFn: createFaction,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: factionKeys.list() })
      qc.setQueryData(factionKeys.detail(row.id), row)
    },
  })
}
