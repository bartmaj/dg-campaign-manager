import type { ClueDeliveryInput } from '../../domain/clueDelivery'

/**
 * Wire-format clue delivery event row returned by /api/clues/:id/delivery.
 * Mirrors db/schema.ts clueDeliveryEvents.
 */
export type ClueDeliveryEventRow = {
  id: string
  clueId: string
  sessionId: string
  kind: 'delivered' | 'undelivered'
  pcIds: string[]
  note: string | null
  appliedAt: string
}

export type ClueDeliveryCurrentSession = {
  sessionId: string
  pcIds: string[]
  appliedAt: string
}

export type ClueDeliveryResponse = {
  events: ClueDeliveryEventRow[]
  currentState: {
    isDelivered: boolean
    sessions: ClueDeliveryCurrentSession[]
  }
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

export function getClueDelivery(clueId: string): Promise<ClueDeliveryResponse> {
  return fetchJson<ClueDeliveryResponse>(`/api/clues/${encodeURIComponent(clueId)}/delivery`)
}

/**
 * Append a delivery event for a clue. The wire input may omit `clueId`
 * — the server reads it from the URL — but the type insists on it for
 * caller-side schema parity.
 */
export function createClueDeliveryEvent(
  clueId: string,
  input: Omit<ClueDeliveryInput, 'clueId'>,
): Promise<ClueDeliveryEventRow> {
  return fetchJson<ClueDeliveryEventRow>(`/api/clues/${encodeURIComponent(clueId)}/delivery`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
