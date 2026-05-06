import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SanChangeInput } from '../../domain/sanity'
import { applySanityChange, type SanChangeResult } from '../api/sanity'
import { pcKeys } from './usePcs'
import { useStampSessionId } from './usePlayModeStamp'
import { sanityKeys } from './useSanity'
import { searchIndexQueryKey } from './useSearchIndex'
import { sessionKeys } from './useSessions'

type Args = { pcId: string; input: SanChangeInput }

/**
 * Mutation for applying a SAN change. The mutation result includes
 * `crossedThresholds` so the caller can show a breaking-point flash.
 *
 * Auto-stamps `sessionId` from the current session when in play mode
 * (#026) — see `useStampSessionId`.
 */
export function useApplySanityChange() {
  const qc = useQueryClient()
  const stamp = useStampSessionId<SanChangeInput>()
  return useMutation<SanChangeResult, Error, Args>({
    mutationFn: ({ pcId, input }) => applySanityChange(pcId, stamp(input)),
    onSuccess: ({ pc, event }) => {
      qc.invalidateQueries({ queryKey: pcKeys.detail(pc.id) })
      qc.invalidateQueries({ queryKey: sanityKeys.events(pc.id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
      if (event?.sessionId) {
        qc.invalidateQueries({ queryKey: sessionKeys.lists() })
      }
    },
  })
}
