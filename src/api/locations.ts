import type { LocationInput } from '../../domain/location'

/**
 * Wire-format Location row returned by /api/locations. Mirrors db/schema.ts locations.
 */
export type LocationRow = {
  id: string
  campaignId: string | null
  parentLocationId: string | null
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type LocationFilter = {
  parentLocationId?: string
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

function buildLocationUrl(filter: LocationFilter): string {
  const params = new URLSearchParams()
  if (filter.parentLocationId) params.set('parentLocationId', filter.parentLocationId)
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  const qs = params.toString()
  return qs.length > 0 ? `/api/locations?${qs}` : '/api/locations'
}

export function listLocations(filter: LocationFilter = {}): Promise<LocationRow[]> {
  return fetchJson<LocationRow[]>(buildLocationUrl(filter))
}

export function getLocation(id: string): Promise<LocationRow> {
  return fetchJson<LocationRow>(`/api/locations/${encodeURIComponent(id)}`)
}

export function createLocation(input: LocationInput): Promise<LocationRow> {
  return fetchJson<LocationRow>('/api/locations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
