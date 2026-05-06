import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppModeProvider } from '../../lib/mode'
import { __resetCurrentSessionForTests } from '../../lib/currentSession'
import { PlayActionsToolbar } from './PlayActionsToolbar'

vi.mock('../../api/clueDelivery', () => ({
  createClueDeliveryEvent: vi.fn(),
  getClueDelivery: vi.fn(),
}))
vi.mock('../../api/npcEncounters', () => ({
  createNpcEncounter: vi.fn(),
  listNpcEncounters: vi.fn(),
  getSessionEncounteredNpcs: vi.fn(),
}))
import { createClueDeliveryEvent } from '../../api/clueDelivery'
import { createNpcEncounter } from '../../api/npcEncounters'

function renderToolbar(initialEntries: string[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // Empty data is fine — we don't open the popovers in these tests.
  qc.setQueryData(['pcs', 'list', {}], [])
  qc.setQueryData(['clues', 'list', {}], [])
  qc.setQueryData(['scenes', 'list', {}], [])
  qc.setQueryData(['bonds', 'list', {}], [])
  qc.setQueryData(['npcs', 'list', {}], [])

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

  it('renders all six buttons in play mode', () => {
    renderToolbar(['/?mode=play'])
    expect(screen.getByRole('button', { name: /Cmd-K palette/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Clue delivered/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Log SAN change/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Log Bond damage/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Encounter NPC/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jump to current session/i })).toBeInTheDocument()
  })

  it('disables Jump when no current session is set', () => {
    renderToolbar(['/?mode=play'])
    const btn = screen.getByRole('button', { name: /Jump to current session/i })
    expect(btn).toBeDisabled()
  })

  it('calls the clue-delivery mutation with sessionId, pcIds, kind=delivered', async () => {
    window.localStorage.setItem('dg.currentSessionId', 'sess-42')
    const mockCreate = vi.mocked(createClueDeliveryEvent)
    mockCreate.mockResolvedValue({
      id: 'evt-1',
      clueId: 'clue-1',
      sessionId: 'sess-42',
      kind: 'delivered',
      pcIds: ['pc-1'],
      note: null,
      appliedAt: '2026-04-30T10:00:00Z',
    })
    const user = userEvent.setup()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['pcs', 'list', {}], [{ id: 'pc-1', name: 'Agent A' }])
    qc.setQueryData(['clues', 'list', {}], [{ id: 'clue-1', name: 'Bloodstain' }])
    qc.setQueryData(['scenes', 'list', {}], [])
    qc.setQueryData(['bonds', 'list', {}], [])

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/?mode=play']}>
          <Routes>
            <Route
              path="/"
              element={
                <AppModeProvider>
                  <PlayActionsToolbar />
                </AppModeProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Clue delivered/i }))
    // Pick clue and PC
    const dialog = await screen.findByRole('dialog', { name: /Mark clue delivered/i })
    const cluePicker = dialog.querySelector('select') as HTMLSelectElement
    await user.selectOptions(cluePicker, 'clue-1')
    await user.click(screen.getByLabelText('Agent A'))
    // Submit
    await user.click(screen.getByRole('button', { name: /Mark delivered/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith('clue-1', {
        sessionId: 'sess-42',
        kind: 'delivered',
        pcIds: ['pc-1'],
        note: null,
      })
    })
  })

  it('logs an NPC encounter with auto-stamped sessionId from current session', async () => {
    window.localStorage.setItem('dg.currentSessionId', 'sess-42')
    const mockCreate = vi.mocked(createNpcEncounter)
    mockCreate.mockResolvedValue({
      id: 'enc-1',
      npcId: 'npc-1',
      sessionId: 'sess-42',
      note: null,
      appliedAt: '2026-04-30T10:00:00Z',
    })
    const user = userEvent.setup()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['pcs', 'list', {}], [])
    qc.setQueryData(['clues', 'list', {}], [])
    qc.setQueryData(['scenes', 'list', {}], [])
    qc.setQueryData(['bonds', 'list', {}], [])
    qc.setQueryData(['npcs', 'list', {}], [{ id: 'npc-1', name: 'Mr. Verity' }])

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/?mode=play']}>
          <Routes>
            <Route
              path="/"
              element={
                <AppModeProvider>
                  <PlayActionsToolbar />
                </AppModeProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Encounter NPC/i }))
    const dialog = await screen.findByRole('dialog', { name: /Encounter NPC/i })
    const select = dialog.querySelector('select') as HTMLSelectElement
    await user.selectOptions(select, 'npc-1')
    await user.click(screen.getByRole('button', { name: /Log encounter/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith('npc-1', {
        sessionId: 'sess-42',
        note: null,
      })
    })
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
