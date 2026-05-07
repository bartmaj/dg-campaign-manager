import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { FactionRow } from '../../api/factions'
import { factionKeys } from '../../hooks/useFactions'
import EditFactionPage from './EditFactionPage'

const FACTION_ID = 'faction-1'

function makeFaction(overrides: Partial<FactionRow> = {}): FactionRow {
  return {
    id: FACTION_ID,
    campaignId: null,
    name: 'The Cult of the Black Goat',
    description: 'Ancient and hungry.',
    agenda: 'Recruit acolytes.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(faction: FactionRow) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(factionKeys.detail(FACTION_ID), faction)
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/factions/${FACTION_ID}/edit`]}>
        <Routes>
          <Route path="/factions/:id/edit" element={<EditFactionPage />} />
          <Route path="/factions/:id" element={<div>Faction detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EditFactionPage', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (init?.method === 'PATCH' && url.includes(`/api/factions/${FACTION_ID}`)) {
          return new Response(
            JSON.stringify(makeFaction({ name: 'Updated', updatedAt: '2026-02-01T00:00:00Z' })),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes(`/api/factions/${FACTION_ID}`)) {
          return new Response(JSON.stringify(makeFaction()), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    )
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('pre-populates fields from the seeded detail query and submits a PATCH', async () => {
    renderPage(makeFaction())

    expect(screen.getByRole('heading', { name: /edit faction/i })).toBeInTheDocument()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    await waitFor(() => expect(nameInput.value).toBe('The Cult of the Black Goat'))
    expect((screen.getByLabelText('Agenda') as HTMLTextAreaElement).value).toBe('Recruit acolytes.')
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe(
      'Ancient and hungry.',
    )

    const user = userEvent.setup()
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated')
    await user.click(screen.getByRole('button', { name: /save faction/i }))

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/factions/${FACTION_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      ),
    )
  })
})
