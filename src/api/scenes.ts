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

export type SceneFilter = {
  scenarioId?: string
  q?: string
}

function buildSceneUrl(filter: SceneFilter): string {
  const params = new URLSearchParams()
  if (filter.scenarioId) params.set('scenarioId', filter.scenarioId)
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  const qs = params.toString()
  return qs.length > 0 ? `/api/scenes?${qs}` : '/api/scenes'
}

export function listScenes(filter: SceneFilter | string = {}): Promise<SceneRow[]> {
  // Backward-compat: callers used to pass a bare scenarioId string.
  const f: SceneFilter = typeof filter === 'string' ? { scenarioId: filter } : filter
  return fetchJson<SceneRow[]>(buildSceneUrl(f))
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
