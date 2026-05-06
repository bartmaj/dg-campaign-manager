import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetCurrentSessionForTests, useCurrentSessionId } from './currentSession'

describe('useCurrentSessionId', () => {
  beforeEach(() => {
    __resetCurrentSessionForTests()
    window.localStorage.clear()
  })

  it('round-trips through localStorage', () => {
    const { result } = renderHook(() => useCurrentSessionId())
    expect(result.current.value).toBeNull()

    act(() => result.current.set('sess-42'))
    expect(result.current.value).toBe('sess-42')
    expect(window.localStorage.getItem('dg.currentSessionId')).toBe('sess-42')

    act(() => result.current.set(null))
    expect(result.current.value).toBeNull()
    expect(window.localStorage.getItem('dg.currentSessionId')).toBeNull()
  })

  it('syncs across hook instances in the same tab', () => {
    const a = renderHook(() => useCurrentSessionId())
    const b = renderHook(() => useCurrentSessionId())

    act(() => a.result.current.set('sess-7'))
    expect(a.result.current.value).toBe('sess-7')
    expect(b.result.current.value).toBe('sess-7')

    act(() => b.result.current.set('sess-9'))
    expect(a.result.current.value).toBe('sess-9')
    expect(b.result.current.value).toBe('sess-9')
  })
})
