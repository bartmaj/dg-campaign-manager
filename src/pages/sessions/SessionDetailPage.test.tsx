import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionReport, SessionRow } from '../../api/sessions'
import { edgeKeys } from '../../hooks/useEdges'
import { sessionKeys } from '../../hooks/useSessions'
import { sessionReportKeys } from '../../hooks/useSessionReport'
import { AppModeProvider } from '../../lib/mode'
import SessionDetailPage from './SessionDetailPage'

vi.mock('../../api/sessions', async () => {
  const actual = await vi.importActual<typeof import('../../api/sessions')>('../../api/sessions')
  return {
    ...actual,
    patchSession: vi.fn(),
  }
})

import { patchSession } from '../../api/sessions'

const SESSION_ID = '11111111-1111-4111-8111-111111111111'

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: SESSION_ID,
    campaignId: 'camp-1',
    name: 'Op: Black Goat',
    description: 'First contact.',
    inGameDate: '1995-03-12',
    inGameDateEnd: null,
    realWorldDate: '2026-04-01T00:00:00Z',
    notes: null,
    playerNotes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(opts: {
  session?: SessionRow
  report?: SessionReport
  initialEntries?: string[]
}) {
  const session = opts.session ?? makeSession()
  const report: SessionReport = opts.report ?? {
    sessionId: SESSION_ID,
    items: [],
    generatedAt: '2026-04-30T10:00:00Z',
  }
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  })
  qc.setQueryData(sessionKeys.detail(SESSION_ID), session)
  qc.setQueryData(sessionReportKeys.detail(SESSION_ID), report)
  // Edge hooks fire by default; seed empty arrays to avoid network calls.
  qc.setQueryData(edgeKeys.list({ sourceType: 'session', sourceId: SESSION_ID }), [])
  qc.setQueryData(edgeKeys.list({ targetType: 'session', targetId: SESSION_ID }), [])
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={opts.initialEntries ?? [`/sessions/${SESSION_ID}`]}>
        <AppModeProvider>
          <Routes>
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
          </Routes>
        </AppModeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SessionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders the event log empty state when no events are tagged', () => {
    renderPage({})
    expect(screen.getByRole('heading', { name: /event log/i })).toBeInTheDocument()
    expect(screen.getByText(/no tagged events yet/i)).toBeInTheDocument()
  })

  it('renders one row per event kind in the unified log', () => {
    const report: SessionReport = {
      sessionId: SESSION_ID,
      items: [
        {
          kind: 'clue_delivered',
          appliedAt: '2026-04-01T14:32:00Z',
          clueId: 'clue-1',
          clueName: 'Bloody letter',
          pcIds: ['pc-1'],
          note: 'in the diner',
        },
        {
          kind: 'npc_encountered',
          appliedAt: '2026-04-01T14:55:00Z',
          npcId: 'npc-1',
          npcName: 'Agent Marlow',
          note: null,
        },
        {
          kind: 'bond_damage',
          appliedAt: '2026-04-01T15:10:00Z',
          bondId: 'bond-1',
          bondName: 'Sister Mary',
          pcId: 'pc-1',
          delta: -2,
          reason: 'argued',
        },
        {
          kind: 'san_change',
          appliedAt: '2026-04-01T15:45:00Z',
          pcId: 'pc-1',
          pcName: 'Agent Smith',
          delta: -5,
          source: 'saw the deep one',
          crossedThresholds: [],
        },
      ],
      generatedAt: '2026-04-30T10:00:00Z',
    }
    renderPage({ report })
    expect(screen.getByText('Bloody letter')).toBeInTheDocument()
    expect(screen.getByText('Agent Marlow')).toBeInTheDocument()
    expect(screen.getByText('Sister Mary')).toBeInTheDocument()
    expect(screen.getByText('Agent Smith')).toBeInTheDocument()
    expect(screen.getByText(/source: saw the deep one/)).toBeInTheDocument()
    expect(screen.getByText(/reason: argued/)).toBeInTheDocument()
    expect(screen.getByText(/note: in the diner/)).toBeInTheDocument()
  })

  it('saves notes via patchSession when the GM clicks Save notes', async () => {
    vi.mocked(patchSession).mockResolvedValue(makeSession({ notes: 'recap text' }))
    renderPage({ session: makeSession({ notes: null }) })

    const textarea = screen.getByLabelText(/session notes/i)
    await act(async () => {
      await userEvent.type(textarea, 'recap text')
    })

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save notes/i }))
    })

    await waitFor(() => {
      expect(patchSession).toHaveBeenCalledWith(SESSION_ID, { notes: 'recap text' })
    })
  })

  it('renders the Download handout link pointing at the handout endpoint', () => {
    renderPage({})
    const link = screen.getByRole('link', { name: /player-safe handout/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe(`/api/sessions/${SESSION_ID}/handout`)
    expect(link.hasAttribute('download')).toBe(true)
  })

  it('renders the Player notes card with empty state and saves via patchSession', async () => {
    vi.mocked(patchSession).mockResolvedValue(makeSession({ playerNotes: 'Public recap.' }))
    renderPage({ session: makeSession({ playerNotes: null }) })

    expect(screen.getByRole('heading', { name: /player notes/i })).toBeInTheDocument()
    const textarea = screen.getByLabelText(/^player notes$/i)
    await act(async () => {
      await userEvent.type(textarea, 'Public recap.')
    })
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save player notes/i }))
    })
    await waitFor(() => {
      expect(patchSession).toHaveBeenCalledWith(SESSION_ID, { playerNotes: 'Public recap.' })
    })
  })
})
