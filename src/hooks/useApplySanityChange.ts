import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SanChangeInput } from '../../domain/sanity'
import { applySanityChange, type SanChangeResult } from '../api/sanity'
import { pcKeys } from './usePcs'
import { sanityKeys } from './useSanity'

type Args = { pcId: string; input: SanChangeInput }

/**
 * Mutation for applying a SAN change. The mutation result includes
 * `crossedThresholds` so the caller can show a breaking-point flash.
 */
export function useApplySanityChange() {
  const qc = useQueryClient()
  return useMutation<SanChangeResult, Error, Args>({
    mutationFn: ({ pcId, input }) => applySanityChange(pcId, input),
    onSuccess: ({ pc }) => {
      qc.invalidateQueries({ queryKey: pcKeys.detail(pc.id) })
      qc.invalidateQueries({ queryKey: sanityKeys.events(pc.id) })
    },
  })
}
