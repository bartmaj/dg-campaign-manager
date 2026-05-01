import { useQuery } from '@tanstack/react-query'
import type { BondTargetType } from '../../domain/bonds'
import {
  getBond,
  listBonds,
  type BondListFilter,
  type BondRow,
  type BondWithEvents,
} from '../api/bonds'

export const bondKeys = {
  all: ['bonds'] as const,
  lists: () => [...bondKeys.all, 'list'] as const,
  list: (filter: BondListFilter) => [...bondKeys.lists(), filter] as const,
  detail: (id: string) => [...bondKeys.all, 'detail', id] as const,
}

export function useBondsForPc(pcId: string | undefined) {
  return useQuery<BondRow[]>({
    queryKey: bondKeys.list({ pcId: pcId ?? '' }),
    queryFn: () => listBonds({ pcId: pcId as string }),
    enabled: Boolean(pcId),
  })
}

/**
 * Lists bonds that POINT AT (targetType, targetId) — the reverse-lookup
 * powering the "Bonds with this character" sections on PC and NPC detail
 * pages.
 */
export function useIncomingBonds(targetType: BondTargetType, targetId: string | undefined) {
  return useQuery<BondRow[]>({
    queryKey: bondKeys.list({ targetType, targetId: targetId ?? '' }),
    queryFn: () => listBonds({ targetType, targetId: targetId as string }),
    enabled: Boolean(targetId),
  })
}

export function useBond(id: string | undefined) {
  return useQuery<BondWithEvents>({
    queryKey: bondKeys.detail(id ?? ''),
    queryFn: () => getBond(id as string),
    enabled: Boolean(id),
  })
}
