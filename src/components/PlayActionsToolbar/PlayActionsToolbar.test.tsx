import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppModeProvider } from '../../lib/mode'
import { __resetCurrentSessionForTests } from '../../lib/currentSession'
import { PlayActionsToolbar } from './PlayActionsToolbar'

function renderToolbar(initialEntries: string[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // Empty data is fine — we don't open the popovers in these tests.
  qc.setQueryData(['pcs', 'list', {}], [])
  qc.setQueryData(['clues', 'list', {}], [])
  qc.setQueryData(['scenes', 'list', {}], [])
  qc.setQueryData(['bonds', 'list', {}], [])

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="/"
            element={
              <AppModeProvider>
                <PlayActionsToolbar />
                <div data-testid="loc-marker" />
              </AppModeProvider>
            }
          />
          <Route
            path="/sessions/:id"
            element={<div data-testid="sessions-page">on session page</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PlayActionsToolbar', () => {
  beforeEach(() => {
    window.localStorage.clear()
    __resetCurrentSessionForTests()
  })

  it('does not render in prep mode', () => {
    renderToolbar(['/'])
    expect(
      screen.queryByRole('region', { name: /play-mode primary actions/i }),
    ).not.toBeInTheDocument()
  })

  it('renders all five buttons in play mode', () => {
    renderToolbar(['/?mode=play'])
    expect(screen.getByRole('button', { name: /Cmd-K palette/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Clue delivered/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Log SAN change/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Log Bond damage/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jump to current session/i })).toBeInTheDocument()
  })

  it('disables Jump when no current session is set', () => {
    renderToolbar(['/?mode=play'])
    const btn = screen.getByRole('button', { name: /Jump to current session/i })
    expect(btn).toBeDisabled()
  })

  it('navigates to /sessions/:id on Jump when current session is set', async () => {
    // Seed before render so the toolbar reads it on first paint.
    window.localStorage.setItem('dg.currentSessionId', 'sess-42')
    const user = userEvent.setup()
    renderToolbar(['/?mode=play'])
    const btn = screen.getByRole('button', { name: /Jump to current session/i })
    expect(btn).not.toBeDisabled()
    await user.click(btn)
    expect(screen.getByTestId('sessions-page')).toBeInTheDocument()
  })
})
