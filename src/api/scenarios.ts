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

export function listScenarios(): Promise<ScenarioRow[]> {
  return fetchJson<ScenarioRow[]>('/api/scenarios')
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
