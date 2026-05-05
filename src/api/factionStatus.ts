/**
 * Faction status events (#020) — wire layer for the per-faction status
 * timeline. Mirrors the bond/sanity event pattern.
 */

export type FactionStatusEvent = {
  id: string
  factionId: string
  note: string
  /** ISO datetime — the date the GM associates with this status change. */
  occurredAt: string
  sessionId: string | null
  createdAt: string
}

export type FactionStatusInput = {
  factionId: string
  note: string
  /** ISO datetime — accepts a YYYY-MM-DD string from a date input as well. */
  occurredAt: string
  sessionId?: string
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

export function listFactionStatus(factionId: string): Promise<FactionStatusEvent[]> {
  return fetchJson<FactionStatusEvent[]>(`/api/factions/${encodeURIComponent(factionId)}/status`)
}

export function createFactionStatus(input: FactionStatusInput): Promise<FactionStatusEvent> {
  const { factionId, ...body } = input
  return fetchJson<FactionStatusEvent>(`/api/factions/${encodeURIComponent(factionId)}/status`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteFactionStatus(eventId: string): Promise<FactionStatusEvent> {
  return fetchJson<FactionStatusEvent>(
    `/api/faction-status-events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    },
  )
}
