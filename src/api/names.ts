import type { EntityType } from '../../db/schema'

export type EntityNameRow = { id: string; name: string }

export type EntityNamesResponse = {
  items: EntityNameRow[]
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

/**
 * Batched name lookup. The backend tolerates duplicates and unknown ids
 * (returns nothing for them), but we de-dupe + sort here so the cache
 * key is canonical regardless of insertion order.
 */
export function getEntityNames(type: EntityType, ids: string[]): Promise<EntityNamesResponse> {
  const params = new URLSearchParams()
  params.set('type', type)
  params.set('ids', ids.join(','))
  return fetchJson<EntityNamesResponse>(`/api/search/names?${params.toString()}`)
}
