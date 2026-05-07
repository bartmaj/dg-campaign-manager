import type { EntityType } from '../../db/schema'
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
  notes: string | null
  playerNotes: string | null
  createdAt: string
  updatedAt: string
}

export type SessionReportItem =
  | {
      kind: 'clue_delivered'
      appliedAt: string
      clueId: string
      clueName: string
      pcIds: string[]
      note: string | null
    }
  | {
      kind: 'clue_undelivered'
      appliedAt: string
      clueId: string
      clueName: string
      pcIds: string[]
      note: string | null
    }
  | {
      kind: 'npc_encountered'
      appliedAt: string
      npcId: string
      npcName: string
      note: string | null
    }
  | {
      kind: 'bond_damage'
      appliedAt: string
      bondId: string
      bondName: string
      pcId: string
      delta: number
      reason: string | null
    }
  | {
      kind: 'san_change'
      appliedAt: string
      pcId: string
      pcName: string
      delta: number
      source: string
      crossedThresholds: number[]
    }

export type SessionReport = {
  sessionId: string
  items: SessionReportItem[]
  generatedAt: string
}

export type SessionPatch = {
  notes?: string | null
  playerNotes?: string | null
  description?: string | null
  name?: string
  inGameDate?: string | null
  inGameDateEnd?: string | null
  realWorldDate?: string | Date | null
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
  involvesType?: EntityType
  involvesId?: string
}

function buildSessionUrl(orderBy: SessionOrderBy, filter: SessionFilter): string {
  const params = new URLSearchParams()
  params.set('orderBy', orderBy)
  if (filter.q && filter.q.trim().length > 0) params.set('q', filter.q.trim())
  if (filter.involvesType && filter.involvesId) {
    params.set('involvesType', filter.involvesType)
    params.set('involvesId', filter.involvesId)
  }
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

export type DeliveredClueRow = {
  clueId: string
  clueName: string
  pcIds: string[]
  appliedAt: string
}

export function getSessionDeliveredClues(
  sessionId: string,
): Promise<{ items: DeliveredClueRow[] }> {
  return fetchJson<{ items: DeliveredClueRow[] }>(
    `/api/sessions/${encodeURIComponent(sessionId)}/delivered-clues`,
  )
}

export function getSessionReport(sessionId: string): Promise<SessionReport> {
  return fetchJson<SessionReport>(`/api/sessions/${encodeURIComponent(sessionId)}/report`)
}

export function patchSession(id: string, patch: SessionPatch): Promise<SessionRow> {
  // Normalize realWorldDate to ISO when sent — server accepts both
  // strings and Dates, but JSON doesn't carry Date.
  const body: Record<string, unknown> = { ...patch }
  if (patch.realWorldDate instanceof Date) {
    body.realWorldDate = patch.realWorldDate.toISOString()
  }
  return fetchJson<SessionRow>(`/api/sessions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** Alias for symmetry with other update{Entity} wrappers. */
export const updateSession = patchSession

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
}
