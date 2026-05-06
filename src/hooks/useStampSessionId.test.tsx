import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetCurrentSessionForTests } from '../lib/currentSession'
import { AppModeProvider } from '../lib/mode'
import { useApplyBondDamage } from './useApplyBondDamage'
import { useApplySanityChange } from './useApplySanityChange'
import { useCreateClueDeliveryEvent } from './useClueDelivery'
import { useCreateNpcEncounter } from './useNpcEncounters'

// Mock the underlying API modules — we want to assert what the mutation
// passes through after stamping, without making real fetches.
vi.mock('../api/bonds', () => ({
  applyBondDamage: vi.fn(),
}))
vi.mock('../api/sanity', () => ({
  applySanityChange: vi.fn(),
}))
vi.mock('../api/clueDelivery', () => ({
  createClueDeliveryEvent: vi.fn(),
  getClueDelivery: vi.fn(),
}))
vi.mock('../api/npcEncounters', () => ({
  createNpcEncounter: vi.fn(),
  listNpcEncounters: vi.fn(),
  getSessionEncounteredNpcs: vi.fn(),
}))

import { applyBondDamage } from '../api/bonds'
import { applySanityChange } from '../api/sanity'
import { createClueDeliveryEvent } from '../api/clueDelivery'
import { createNpcEncounter } from '../api/npcEncounters'

const SESSION = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'

function makeWrapper(initialEntries: string[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/" element={<AppModeProvider>{children}</AppModeProvider>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('play-mode auto-stamping', () => {
  beforeEach(() => {
    window.localStorage.clear()
    __resetCurrentSessionForTests()
    vi.clearAllMocks()
  })
  afterEach(() => {
    __resetCurrentSessionForTests()
  })

  it('useApplyBondDamage injects the current sessionId in play mode when missing', async () => {
    window.localStorage.setItem('dg.currentSessionId', SESSION)
    vi.mocked(applyBondDamage).mockResolvedValue({
      bond: {
        id: 'b1',
        pcId: 'pc',
        name: 'B',
        currentScore: 1,
        maxScore: 4,
        targetType: 'npc',
        targetId: 'n1',
        description: null,
        createdAt: '',
        updatedAt: '',
      },
      event: {
        id: 'e1',
        bondId: 'b1',
        delta: -1,
        reason: null,
        sessionId: SESSION,
        appliedAt: '',
      },
    })
    const { result } = renderHook(() => useApplyBondDamage(), {
      wrapper: makeWrapper(['/?mode=play']),
    })
    await act(async () => {
      await result.current.mutateAsync({ bondId: 'b1', input: { delta: -1, reason: null } })
    })
    expect(applyBondDamage).toHaveBeenCalledWith('b1', {
      delta: -1,
      reason: null,
      sessionId: SESSION,
    })
  })

  it('useApplyBondDamage does NOT inject in prep mode', async () => {
    window.localStorage.setItem('dg.currentSessionId', SESSION)
    vi.mocked(applyBondDamage).mockResolvedValue({
      bond: {
        id: 'b1',
        pcId: 'pc',
        name: 'B',
        currentScore: 1,
        maxScore: 4,
        targetType: 'npc',
        targetId: 'n1',
        description: null,
        createdAt: '',
        updatedAt: '',
      },
      event: {
        id: 'e1',
        bondId: 'b1',
        delta: -1,
        reason: null,
        sessionId: null,
        appliedAt: '',
      },
    })
    const { result } = renderHook(() => useApplyBondDamage(), {
      wrapper: makeWrapper(['/']),
    })
    await act(async () => {
      await result.current.mutateAsync({ bondId: 'b1', input: { delta: -1, reason: null } })
    })
    // prep mode: no auto-stamping; input flows through unchanged.
    expect(applyBondDamage).toHaveBeenCalledWith('b1', { delta: -1, reason: null })
  })

  it('useApplyBondDamage preserves an explicit caller sessionId', async () => {
    window.localStorage.setItem('dg.currentSessionId', SESSION)
    vi.mocked(applyBondDamage).mockResolvedValue({
      bond: {
        id: 'b1',
        pcId: 'pc',
        name: 'B',
        currentScore: 1,
        maxScore: 4,
        targetType: 'npc',
        targetId: 'n1',
        description: null,
        createdAt: '',
        updatedAt: '',
      },
      event: {
        id: 'e1',
        bondId: 'b1',
        delta: -1,
        reason: null,
        sessionId: OTHER,
        appliedAt: '',
      },
    })
    const { result } = renderHook(() => useApplyBondDamage(), {
      wrapper: makeWrapper(['/?mode=play']),
    })
    await act(async () => {
      await result.current.mutateAsync({
        bondId: 'b1',
        input: { delta: -1, reason: null, sessionId: OTHER },
      })
    })
    // Explicit value wins over the current session.
    expect(applyBondDamage).toHaveBeenCalledWith('b1', {
      delta: -1,
      reason: null,
      sessionId: OTHER,
    })
  })

  it('useApplySanityChange injects the current sessionId in play mode when missing', async () => {
    window.localStorage.setItem('dg.currentSessionId', SESSION)
    vi.mocked(applySanityChange).mockResolvedValue({
      pc: { id: 'pc1' } as never,
      event: {
        id: 'e',
        pcId: 'pc1',
        delta: -1,
        source: 'witness',
        sessionId: SESSION,
        crossedThresholds: [],
        appliedAt: '',
      },
      crossedThresholds: [],
    })
    const { result } = renderHook(() => useApplySanityChange(), {
      wrapper: makeWrapper(['/?mode=play']),
    })
    await act(async () => {
      await result.current.mutateAsync({
        pcId: 'pc1',
        input: { delta: -1, source: 'witness' },
      })
    })
    expect(applySanityChange).toHaveBeenCalledWith('pc1', {
      delta: -1,
      source: 'witness',
      sessionId: SESSION,
    })
  })

  it('useCreateClueDeliveryEvent injects the current sessionId in play mode when missing', async () => {
    window.localStorage.setItem('dg.currentSessionId', SESSION)
    vi.mocked(createClueDeliveryEvent).mockResolvedValue({
      id: 'e',
      clueId: 'c',
      sessionId: SESSION,
      kind: 'delivered',
      pcIds: ['p1'],
      note: null,
      appliedAt: '',
    })
    const { result } = renderHook(() => useCreateClueDeliveryEvent('c'), {
      wrapper: makeWrapper(['/?mode=play']),
    })
    await act(async () => {
      await result.current.mutateAsync({
        kind: 'delivered',
        pcIds: ['p1'],
        note: null,
      } as never)
    })
    expect(createClueDeliveryEvent).toHaveBeenCalledWith('c', {
      kind: 'delivered',
      pcIds: ['p1'],
      note: null,
      sessionId: SESSION,
    })
  })

  it('useCreateNpcEncounter injects the current sessionId in play mode when missing', async () => {
    window.localStorage.setItem('dg.currentSessionId', SESSION)
    vi.mocked(createNpcEncounter).mockResolvedValue({
      id: 'e',
      npcId: 'n',
      sessionId: SESSION,
      note: null,
      appliedAt: '',
    })
    const { result } = renderHook(() => useCreateNpcEncounter('n'), {
      wrapper: makeWrapper(['/?mode=play']),
    })
    await act(async () => {
      await result.current.mutateAsync({ note: null } as never)
    })
    await waitFor(() => {
      expect(createNpcEncounter).toHaveBeenCalledWith('n', { note: null, sessionId: SESSION })
    })
  })

  it('does not inject when no current session is set (play mode, sessionId absent)', async () => {
    // currentSessionId not set
    vi.mocked(applyBondDamage).mockResolvedValue({
      bond: {
        id: 'b1',
        pcId: 'pc',
        name: 'B',
        currentScore: 1,
        maxScore: 4,
        targetType: 'npc',
        targetId: 'n1',
        description: null,
        createdAt: '',
        updatedAt: '',
      },
      event: {
        id: 'e1',
        bondId: 'b1',
        delta: -1,
        reason: null,
        sessionId: null,
        appliedAt: '',
      },
    })
    const { result } = renderHook(() => useApplyBondDamage(), {
      wrapper: makeWrapper(['/?mode=play']),
    })
    await act(async () => {
      await result.current.mutateAsync({ bondId: 'b1', input: { delta: -1, reason: null } })
    })
    expect(applyBondDamage).toHaveBeenCalledWith('b1', { delta: -1, reason: null })
  })
})
