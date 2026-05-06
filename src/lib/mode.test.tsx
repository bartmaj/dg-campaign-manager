import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppModeProvider, useAppMode, useIsPlayMode } from './mode'

function ModeReadout() {
  const { mode, setMode } = useAppMode()
  const isPlay = useIsPlayMode()
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="is-play">{String(isPlay)}</span>
      <button onClick={() => setMode('play')}>go play</button>
      <button onClick={() => setMode('prep')}>go prep</button>
    </div>
  )
}

function LocationReadout() {
  const loc = useLocation()
  return <span data-testid="search">{loc.search}</span>
}

function renderWithRouter(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/"
          element={
            <AppModeProvider>
              <ModeReadout />
              <LocationReadout />
            </AppModeProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppModeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    window.localStorage.clear()
  })

  it('defaults to prep when nothing is set', () => {
    renderWithRouter(['/'])
    expect(screen.getByTestId('mode').textContent).toBe('prep')
    expect(screen.getByTestId('is-play').textContent).toBe('false')
  })

  it('reads initial mode from URL ?mode=play', () => {
    renderWithRouter(['/?mode=play'])
    expect(screen.getByTestId('mode').textContent).toBe('play')
    expect(screen.getByTestId('is-play').textContent).toBe('true')
  })

  it('falls back to localStorage when URL has no mode', () => {
    window.localStorage.setItem('dg.mode', 'play')
    renderWithRouter(['/'])
    expect(screen.getByTestId('mode').textContent).toBe('play')
  })

  it('persists toggle to localStorage and URL', async () => {
    const user = userEvent.setup()
    renderWithRouter(['/'])
    expect(screen.getByTestId('mode').textContent).toBe('prep')

    await user.click(screen.getByRole('button', { name: 'go play' }))
    expect(screen.getByTestId('mode').textContent).toBe('play')
    expect(window.localStorage.getItem('dg.mode')).toBe('play')
    expect(screen.getByTestId('search').textContent).toContain('mode=play')

    await user.click(screen.getByRole('button', { name: 'go prep' }))
    expect(screen.getByTestId('mode').textContent).toBe('prep')
    expect(window.localStorage.getItem('dg.mode')).toBe('prep')
    // prep is the default — keep URLs tidy by clearing the param.
    expect(screen.getByTestId('search').textContent ?? '').not.toContain('mode=')
  })

  it('treats invalid URL values as default and ignores them', () => {
    renderWithRouter(['/?mode=garbage'])
    // Effect runs synchronously inside act() during render; force a flush.
    act(() => {})
    expect(screen.getByTestId('mode').textContent).toBe('prep')
  })
})
