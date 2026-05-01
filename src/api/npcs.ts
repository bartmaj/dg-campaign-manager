import type { NpcInput, NpcStatus } from '../../domain/npc'

/**
 * Wire-format NPC row returned by /api/npcs. Mirrors db/schema.ts npcs.
 */
export type NpcRow = {
  id: string
  campaignId: string | null
  name: string
  description: string | null
  factionId: string | null
  profession: string | null
  str: number | null
  con: number | null
  dex: number | null
  intelligence: number | null
  pow: number | null
  cha: number | null
  hp: number | null
  wp: number | null
  mannerisms: string | null
  voice: string | null
  secrets: string | null
  status: NpcStatus
  locationId: string | null
  currentGoal: string | null
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

export function listNpcs(): Promise<NpcRow[]> {
  return fetchJson<NpcRow[]>('/api/npcs')
}

export function getNpc(id: string): Promise<NpcRow> {
  return fetchJson<NpcRow>(`/api/npcs/${encodeURIComponent(id)}`)
}

export function createNpc(input: NpcInput): Promise<NpcRow> {
  return fetchJson<NpcRow>('/api/npcs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
