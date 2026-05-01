import type { ClueInput } from '../../domain/clue'

/**
 * Wire-format Clue row returned by /api/clues. Mirrors db/schema.ts clues.
 */
export type ClueRow = {
  id: string
  campaignId: string | null
  name: string
  description: string | null
  originScenarioId: string | null
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

export function listClues(): Promise<ClueRow[]> {
  return fetchJson<ClueRow[]>('/api/clues')
}

export function getClue(id: string): Promise<ClueRow> {
  return fetchJson<ClueRow>(`/api/clues/${encodeURIComponent(id)}`)
}

export function createClue(input: ClueInput): Promise<ClueRow> {
  return fetchJson<ClueRow>('/api/clues', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
