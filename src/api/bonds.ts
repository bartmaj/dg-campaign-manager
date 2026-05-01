import type { BondDamageInput, BondInput, BondTargetType } from '../../domain/bonds'

/**
 * Wire-format Bond row returned by /api/bonds. Mirrors db/schema.ts bonds.
 */
export type BondRow = {
  id: string
  pcId: string
  name: string
  currentScore: number
  maxScore: number
  targetType: BondTargetType
  targetId: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type BondDamageEvent = {
  id: string
  bondId: string
  delta: number
  reason: string | null
  sessionId: string | null
  appliedAt: string
}

export type BondWithEvents = {
  bond: BondRow
  events: BondDamageEvent[]
}

export type BondListFilter = {
  pcId?: string
  targetType?: BondTargetType
  targetId?: string
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

function buildBondsUrl(filter: BondListFilter): string {
  const params = new URLSearchParams()
  if (filter.pcId) params.set('pcId', filter.pcId)
  if (filter.targetType) params.set('targetType', filter.targetType)
  if (filter.targetId) params.set('targetId', filter.targetId)
  const qs = params.toString()
  return qs.length > 0 ? `/api/bonds?${qs}` : '/api/bonds'
}

export function listBonds(filter: BondListFilter): Promise<BondRow[]> {
  return fetchJson<BondRow[]>(buildBondsUrl(filter))
}

export function getBond(id: string): Promise<BondWithEvents> {
  return fetchJson<BondWithEvents>(`/api/bonds/${encodeURIComponent(id)}`)
}

export function createBond(input: BondInput): Promise<BondRow> {
  return fetchJson<BondRow>('/api/bonds', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function applyBondDamage(
  bondId: string,
  input: BondDamageInput,
): Promise<{ bond: BondRow; event: BondDamageEvent }> {
  return fetchJson<{ bond: BondRow; event: BondDamageEvent }>(
    `/api/bonds/${encodeURIComponent(bondId)}/damage`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export function deleteBond(id: string): Promise<BondRow> {
  return fetchJson<BondRow>(`/api/bonds/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
