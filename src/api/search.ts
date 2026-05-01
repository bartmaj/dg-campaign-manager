import type { SearchIndexItem } from '../../domain/searchMatch'

export type SearchIndexResponse = {
  items: SearchIndexItem[]
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

export function getSearchIndex(): Promise<SearchIndexResponse> {
  return fetchJson<SearchIndexResponse>('/api/search/index')
}
