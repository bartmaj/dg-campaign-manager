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

export type ClueFilter = {
  originScenarioId?: string
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

function buildClueUrl(filter: ClueFilter): string {
  const params = new URLSearchParams()
  if (filter.originScenarioId) params.set('originScenarioId', filter.originScenarioId)
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  const qs = params.toString()
  return qs.length > 0 ? `/api/clues?${qs}` : '/api/clues'
}

export function listClues(filter: ClueFilter = {}): Promise<ClueRow[]> {
  return fetchJson<ClueRow[]>(buildClueUrl(filter))
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
