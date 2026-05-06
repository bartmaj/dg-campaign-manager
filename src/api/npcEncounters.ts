import type { NpcEncounterInput } from '../../domain/npcEncounter'

/**
 * Wire-format NPC encounter event row returned by /api/npcs/:id/encounters.
 * Mirrors db/schema.ts npcEncounterEvents.
 */
export type NpcEncounterEvent = {
  id: string
  npcId: string
  sessionId: string
  note: string | null
  appliedAt: string
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

export function listNpcEncounters(npcId: string): Promise<{ items: NpcEncounterEvent[] }> {
  return fetchJson<{ items: NpcEncounterEvent[] }>(
    `/api/npcs/${encodeURIComponent(npcId)}/encounters`,
  )
}

export function createNpcEncounter(
  npcId: string,
  input: Omit<NpcEncounterInput, 'npcId'>,
): Promise<NpcEncounterEvent> {
  return fetchJson<NpcEncounterEvent>(`/api/npcs/${encodeURIComponent(npcId)}/encounter`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export type EncounteredNpcRow = {
  id: string
  npcId: string
  npcName: string
  note: string | null
  appliedAt: string
}

export function getSessionEncounteredNpcs(
  sessionId: string,
): Promise<{ items: EncounteredNpcRow[] }> {
  return fetchJson<{ items: EncounteredNpcRow[] }>(
    `/api/sessions/${encodeURIComponent(sessionId)}/encountered-npcs`,
  )
}
