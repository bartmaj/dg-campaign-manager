import type { PcInput } from '../../domain/pc'

/**
 * Wire-format PC row returned by /api/pcs. Mirrors the columns in db/schema.ts
 * pcs table. Dates are JSON-encoded as ISO strings by Vercel's response
 * serializer, so we keep them as strings on the client.
 */
export type PcRow = {
  id: string
  campaignId: string | null
  name: string
  description: string | null
  profession: string | null
  str: number
  con: number
  dex: number
  intelligence: number
  pow: number
  cha: number
  hp: number
  wp: number
  bp: number
  sanMax: number
  skills: Array<{ name: string; rating: number }> | null
  motivations: string[] | null
  backstoryHooks: string | null
  sanityCurrent: number | null
  sanityDisorders: string[] | null
  breakingPoints: number[] | null
  adaptedTo: string[] | null
  createdAt: string
  updatedAt: string
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

export type PcFilter = {
  q?: string
}

function buildPcUrl(filter: PcFilter): string {
  const params = new URLSearchParams()
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  const qs = params.toString()
  return qs.length > 0 ? `/api/pcs?${qs}` : '/api/pcs'
}

export function listPcs(filter: PcFilter = {}): Promise<PcRow[]> {
  return fetchJson<PcRow[]>(buildPcUrl(filter))
}

export function getPc(id: string): Promise<PcRow> {
  return fetchJson<PcRow>(`/api/pcs/${encodeURIComponent(id)}`)
}

export function createPc(input: PcInput): Promise<PcRow> {
  return fetchJson<PcRow>('/api/pcs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
