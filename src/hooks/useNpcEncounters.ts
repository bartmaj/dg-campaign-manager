import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NpcEncounterInput } from '../../domain/npcEncounter'
import {
  createNpcEncounter,
  getSessionEncounteredNpcs,
  listNpcEncounters,
  type EncounteredNpcRow,
  type NpcEncounterEvent,
} from '../api/npcEncounters'
import { sessionKeys } from './useSessions'
import { sessionReportKeys } from './useSessionReport'
import { useStampSessionId } from './usePlayModeStamp'

export const npcEncounterKeys = {
  all: ['npcEncounters'] as const,
  list: (npcId: string) => [...npcEncounterKeys.all, 'list', npcId] as const,
  bySession: (sessionId: string) => [...npcEncounterKeys.all, 'bySession', sessionId] as const,
}

export function useNpcEncounters(npcId: string | undefined) {
  return useQuery<{ items: NpcEncounterEvent[] }>({
    queryKey: npcEncounterKeys.list(npcId ?? ''),
    queryFn: () => listNpcEncounters(npcId as string),
    enabled: Boolean(npcId),
  })
}

export function useSessionEncounteredNpcs(sessionId: string | undefined) {
  return useQuery<{ items: EncounteredNpcRow[] }>({
    queryKey: npcEncounterKeys.bySession(sessionId ?? ''),
    queryFn: () => getSessionEncounteredNpcs(sessionId as string),
    enabled: Boolean(sessionId),
  })
}

type CreateInput = Omit<NpcEncounterInput, 'npcId'>

/**
 * Append an NPC-encounter event. In play mode + currentSession,
 * auto-stamps `sessionId` (#026). Invalidates the per-NPC list AND the
 * per-session involves rollup so EntityRecentActivity / SessionDetailPage
 * pick up the new event without manual refresh.
 */
export function useCreateNpcEncounter(npcId: string | undefined) {
  const qc = useQueryClient()
  const stamp = useStampSessionId<CreateInput>()
  return useMutation<NpcEncounterEvent, Error, CreateInput>({
    mutationFn: (input) => createNpcEncounter(npcId as string, stamp(input)),
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: npcEncounterKeys.list(event.npcId) })
      qc.invalidateQueries({ queryKey: npcEncounterKeys.bySession(event.sessionId) })
      qc.invalidateQueries({ queryKey: sessionReportKeys.detail(event.sessionId) })
      // Session-involves rollup keys vary by orderBy/filter; invalidate the
      // top-level lists() so any session list with this NPC refetches.
      qc.invalidateQueries({ queryKey: sessionKeys.lists() })
    },
  })
}
