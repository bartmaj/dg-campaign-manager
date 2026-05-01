import type { FactionInput } from '../../domain/faction'

/**
 * Wire-format Faction row returned by /api/factions. Mirrors db/schema.ts factions.
 */
export type FactionRow = {
  id: string
  campaignId: string | null
  name: string
  description: string | null
  agenda: string | null
  createdAt: string
  updatedAt: string
}

export type FactionFilter = {
  q?: string
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

function buildFactionUrl(filter: FactionFilter): string {
  const params = new URLSearchParams()
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  const qs = params.toString()
  return qs.length > 0 ? `/api/factions?${qs}` : '/api/factions'
}

export function listFactions(filter: FactionFilter = {}): Promise<FactionRow[]> {
  return fetchJson<FactionRow[]>(buildFactionUrl(filter))
}

export function getFaction(id: string): Promise<FactionRow> {
  return fetchJson<FactionRow>(`/api/factions/${encodeURIComponent(id)}`)
}

export function createFaction(input: FactionInput): Promise<FactionRow> {
  return fetchJson<FactionRow>('/api/factions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
