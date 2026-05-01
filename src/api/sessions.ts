import type { SessionInput } from '../../domain/session'

/**
 * Wire-format Session row returned by /api/sessions. Mirrors db/schema.ts
 * sessions. Dates come over JSON as strings.
 */
export type SessionRow = {
  id: string
  campaignId: string
  name: string
  description: string | null
  inGameDate: string | null
  inGameDateEnd: string | null
  realWorldDate: string | null
  createdAt: string
  updatedAt: string
}

export type SessionOrderBy = 'inGame' | 'realWorld'

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

export type SessionFilter = {
  q?: string
}

function buildSessionUrl(orderBy: SessionOrderBy, filter: SessionFilter): string {
  const params = new URLSearchParams()
  params.set('orderBy', orderBy)
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  return `/api/sessions?${params.toString()}`
}

export function listSessions(
  orderBy: SessionOrderBy = 'realWorld',
  filter: SessionFilter = {},
): Promise<SessionRow[]> {
  return fetchJson<SessionRow[]>(buildSessionUrl(orderBy, filter))
}

export function getSession(id: string): Promise<SessionRow> {
  return fetchJson<SessionRow>(`/api/sessions/${encodeURIComponent(id)}`)
}

export function createSession(input: SessionInput): Promise<SessionRow> {
  // Date over the wire as ISO; the server's Zod schema accepts strings.
  const body = {
    ...input,
    realWorldDate:
      input.realWorldDate === null
        ? null
        : input.realWorldDate instanceof Date
          ? input.realWorldDate.toISOString()
          : input.realWorldDate,
  }
  return fetchJson<SessionRow>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
