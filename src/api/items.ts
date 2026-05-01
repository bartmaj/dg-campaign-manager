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

export function listItems(): Promise<ItemRow[]> {
  return fetchJson<ItemRow[]>('/api/items')
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
