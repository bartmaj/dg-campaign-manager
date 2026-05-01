import type { ItemInput } from '../../domain/item'

/**
 * Wire-format Item row returned by /api/items. Mirrors db/schema.ts items.
 */
export type ItemRow = {
  id: string
  campaignId: string | null
  name: string
  description: string | null
  history: string | null
  ownerNpcId: string | null
  locationId: string | null
  createdAt: string
  updatedAt: string
}

export type ItemFilter = {
  locationId?: string
  ownerNpcId?: string
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

function buildItemUrl(filter: ItemFilter): string {
  const params = new URLSearchParams()
  if (filter.locationId) params.set('locationId', filter.locationId)
  if (filter.ownerNpcId) params.set('ownerNpcId', filter.ownerNpcId)
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  const qs = params.toString()
  return qs.length > 0 ? `/api/items?${qs}` : '/api/items'
}

export function listItems(filter: ItemFilter = {}): Promise<ItemRow[]> {
  return fetchJson<ItemRow[]>(buildItemUrl(filter))
}

export function getItem(id: string): Promise<ItemRow> {
  return fetchJson<ItemRow>(`/api/items/${encodeURIComponent(id)}`)
}

export function createItem(input: ItemInput): Promise<ItemRow> {
  return fetchJson<ItemRow>('/api/items', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
