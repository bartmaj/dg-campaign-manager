import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PcRow } from '../../api/pcs'
import { pcKeys } from '../../hooks/usePcs'
import EditPcPage from './EditPcPage'

const PC_ID = 'pc-1'

function makePc(overrides: Partial<PcRow> = {}): PcRow {
  return {
    id: PC_ID,
    campaignId: null,
    name: 'Agent Smith',
    description: null,
    profession: 'FBI Agent',
    str: 12,
    con: 11,
    dex: 13,
    intelligence: 14,
    pow: 10,
    cha: 9,
    hp: 12,
    wp: 10,
    bp: 40,
    sanMax: 50,
    skills: [{ name: 'Firearms', rating: 50 }],
    motivations: ['Protect the innocent'],
    backstoryHooks: 'Lost partner in DG cell incident.',
    sanityCurrent: 50,
    sanityDisorders: [],
    breakingPoints: [],
    adaptedTo: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(pc: PcRow) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(pcKeys.detail(PC_ID), pc)
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/pcs/${PC_ID}/edit`]}>
        <Routes>
          <Route path="/pcs/:id/edit" element={<EditPcPage />} />
          <Route path="/pcs/:id" element={<div>PC detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EditPcPage', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (init?.method === 'PATCH' && url.includes(`/api/pcs/${PC_ID}`)) {
          return new Response(JSON.stringify(makePc({ name: 'Renamed' })), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        // List endpoints (factions / locations / npcs) called by CharacterForm.
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

  it('pre-populates the CharacterForm from the seeded PC and submits a PATCH', async () => {
    renderPage(makePc())

    expect(screen.getByRole('heading', { name: /edit pc/i })).toBeInTheDocument()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    await waitFor(() => expect(nameInput.value).toBe('Agent Smith'))
    expect((screen.getByLabelText('STR') as HTMLInputElement).value).toBe('12')
    expect((screen.getByLabelText('POW') as HTMLInputElement).value).toBe('10')

    const user = userEvent.setup()
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed')
    await user.click(screen.getByRole('button', { name: /save pc/i }))

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/pcs/${PC_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      ),
    )
  })
})
