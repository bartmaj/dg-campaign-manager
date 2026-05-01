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

export function listFactions(): Promise<FactionRow[]> {
  return fetchJson<FactionRow[]>('/api/factions')
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
