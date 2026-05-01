import type { SanChangeInput } from '../../domain/sanity'
import type { PcRow } from './pcs'

/**
 * Wire-format SAN change event row returned by the API. Mirrors db/schema.ts
 * sanChangeEvents.
 */
export type SanChangeEvent = {
  id: string
  pcId: string
  delta: number
  source: string
  sessionId: string | null
  crossedThresholds: number[] | null
  appliedAt: string
}

export type SanChangeResult = {
  pc: PcRow
  event: SanChangeEvent
  crossedThresholds: number[]
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

export function applySanityChange(pcId: string, input: SanChangeInput): Promise<SanChangeResult> {
  return fetchJson<SanChangeResult>(`/api/pcs/${encodeURIComponent(pcId)}/sanity`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listSanEvents(pcId: string): Promise<SanChangeEvent[]> {
  return fetchJson<SanChangeEvent[]>(`/api/pcs/${encodeURIComponent(pcId)}/sanity-events`)
}

export type PcSanityListsPatch = {
  breakingPoints?: number[]
  sanityDisorders?: string[]
  adaptedTo?: string[]
}

export function patchPcSanityLists(pcId: string, patch: PcSanityListsPatch): Promise<PcRow> {
  return fetchJson<PcRow>(`/api/pcs/${encodeURIComponent(pcId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}
