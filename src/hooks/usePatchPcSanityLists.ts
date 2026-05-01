import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchPcSanityLists, type PcSanityListsPatch } from '../api/sanity'
import type { PcRow } from '../api/pcs'
import { pcKeys } from './usePcs'

type Args = { pcId: string; patch: PcSanityListsPatch }

/**
 * Mutation for editing a PC's SAN-block list fields (breakingPoints,
 * sanityDisorders, adaptedTo). Implemented via a narrow PATCH on
 * /api/pcs/:id — full PC editing is out of scope for #012.
 */
export function usePatchPcSanityLists() {
  const qc = useQueryClient()
  return useMutation<PcRow, Error, Args>({
    mutationFn: ({ pcId, patch }) => patchPcSanityLists(pcId, patch),
    onSuccess: (pc) => {
      qc.invalidateQueries({ queryKey: pcKeys.detail(pc.id) })
    },
  })
}
