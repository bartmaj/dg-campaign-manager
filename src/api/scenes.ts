import type { SceneInput } from '../../domain/scene'

export type SceneRow = {
  id: string
  scenarioId: string
  name: string
  description: string | null
  orderIndex: number
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

export function listScenes(scenarioId?: string): Promise<SceneRow[]> {
  const qs = scenarioId ? `?scenarioId=${encodeURIComponent(scenarioId)}` : ''
  return fetchJson<SceneRow[]>(`/api/scenes${qs}`)
}

export function getScene(id: string): Promise<SceneRow> {
  return fetchJson<SceneRow>(`/api/scenes/${encodeURIComponent(id)}`)
}

export function createScene(input: SceneInput): Promise<SceneRow> {
  return fetchJson<SceneRow>('/api/scenes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
