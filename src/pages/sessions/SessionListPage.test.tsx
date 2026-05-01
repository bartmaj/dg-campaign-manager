import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { SessionRow } from '../../api/sessions'
import { sessionKeys } from '../../hooks/useSessions'
import SessionListPage from './SessionListPage'

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 'session-x',
    campaignId: 'campaign-1',
    name: 'Session X',
    description: null,
    inGameDate: null,
    inGameDateEnd: null,
    realWorldDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// Two sessions with overlapping in-game dates but reversed IRL dates,
// matching the AC scenario in #013.
const S1 = makeSession({
  id: 's1',
  name: 'Alpha',
  inGameDate: '1928-03-10',
  inGameDateEnd: '1928-03-15',
  realWorldDate: '2026-04-20T00:00:00Z',
})
const S2 = makeSession({
  id: 's2',
  name: 'Beta',
  inGameDate: '1928-03-12',
  inGameDateEnd: '1928-03-18',
  realWorldDate: '2026-04-10T00:00:00Z',
})

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // Seed both ordering variants — server is responsible for actually
  // sorting; the page just displays whichever variant is active.
  qc.setQueryData(sessionKeys.list('realWorld'), [S2, S1]) // S2 IRL first
  qc.setQueryData(sessionKeys.list('inGame'), [S1, S2]) // S1 in-game first
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SessionListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function listedNames(): string[] {
  return screen
    .getAllByRole('link')
    .filter((a) => a.getAttribute('href')?.startsWith('/sessions/s'))
    .map((a) => a.textContent ?? '')
}

describe('SessionListPage', () => {
  it('defaults to real-world order', () => {
    renderPage()
    expect(listedNames()).toEqual(['Beta', 'Alpha'])
  })

  it('toggles to in-game order on button click', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /in-game order/i }))
    expect(listedNames()).toEqual(['Alpha', 'Beta'])
  })
})
