import type { EntityType } from '../../db/schema'
import type { EdgeInput } from '../../domain/edges'

/**
 * Wire-format Edge row returned by /api/edges. Mirrors db/schema.ts edges.
 */
export type EdgeRow = {
  id: string
  sourceType: EntityType
  sourceId: string
  targetType: EntityType
  targetId: string
  kind: string
  notes: string | null
  createdAt: string
}

export type EdgeFilter = {
  sourceType?: EntityType
  sourceId?: string
  targetType?: EntityType
  targetId?: string
  kind?: string
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

function buildEdgeUrl(filter: EdgeFilter): string {
  const params = new URLSearchParams()
  if (filter.sourceType) params.set('sourceType', filter.sourceType)
  if (filter.sourceId) params.set('sourceId', filter.sourceId)
  if (filter.targetType) params.set('targetType', filter.targetType)
  if (filter.targetId) params.set('targetId', filter.targetId)
  if (filter.kind) params.set('kind', filter.kind)
  const qs = params.toString()
  return qs.length > 0 ? `/api/edges?${qs}` : '/api/edges'
}

export function listEdges(filter: EdgeFilter = {}): Promise<EdgeRow[]> {
  return fetchJson<EdgeRow[]>(buildEdgeUrl(filter))
}

export function getEdge(id: string): Promise<EdgeRow> {
  return fetchJson<EdgeRow>(`/api/edges/${encodeURIComponent(id)}`)
}

export function createEdge(input: EdgeInput): Promise<EdgeRow> {
  return fetchJson<EdgeRow>('/api/edges', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteEdge(id: string): Promise<EdgeRow> {
  return fetchJson<EdgeRow>(`/api/edges/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
