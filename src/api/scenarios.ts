import type { ScenarioInput } from '../../domain/scenario'

export type ScenarioRow = {
  id: string
  campaignId: string | null
  name: string
  description: string | null
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

export type ScenarioFilter = {
  q?: string
}

function buildScenarioUrl(filter: ScenarioFilter): string {
  const params = new URLSearchParams()
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  const qs = params.toString()
  return qs.length > 0 ? `/api/scenarios?${qs}` : '/api/scenarios'
}

export function listScenarios(filter: ScenarioFilter = {}): Promise<ScenarioRow[]> {
  return fetchJson<ScenarioRow[]>(buildScenarioUrl(filter))
}

export function getScenario(id: string): Promise<ScenarioRow> {
  return fetchJson<ScenarioRow>(`/api/scenarios/${encodeURIComponent(id)}`)
}

export function createScenario(input: ScenarioInput): Promise<ScenarioRow> {
  return fetchJson<ScenarioRow>('/api/scenarios', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
