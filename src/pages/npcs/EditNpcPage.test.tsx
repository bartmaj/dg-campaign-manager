import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NpcRow } from '../../api/npcs'
import { npcKeys } from '../../hooks/useNpcs'
import EditNpcPage from './EditNpcPage'

const NPC_ID = 'npc-1'

function makeNpc(overrides: Partial<NpcRow> = {}): NpcRow {
  return {
    id: NPC_ID,
    campaignId: null,
    name: 'Mr. Verity',
    description: null,
    factionId: null,
    profession: 'Antiquarian',
    str: null,
    con: null,
    dex: null,
    intelligence: null,
    pow: null,
    cha: null,
    hp: 8,
    wp: 6,
    mannerisms: 'Wrings hands.',
    voice: 'Soft.',
    secrets: 'Knows where the book is.',
    status: 'alive',
    locationId: null,
    currentGoal: 'Protect the book.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(npc: NpcRow) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(npcKeys.detail(NPC_ID), npc)
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/npcs/${NPC_ID}/edit`]}>
        <Routes>
          <Route path="/npcs/:id/edit" element={<EditNpcPage />} />
          <Route path="/npcs/:id" element={<div>NPC detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EditNpcPage', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (init?.method === 'PATCH' && url.includes(`/api/npcs/${NPC_ID}`)) {
          return new Response(JSON.stringify(makeNpc({ name: 'Renamed' })), {
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

  it('pre-populates the form from the seeded NPC and submits a PATCH', async () => {
    renderPage(makeNpc())

    expect(screen.getByRole('heading', { name: /edit npc/i })).toBeInTheDocument()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    await waitFor(() => expect(nameInput.value).toBe('Mr. Verity'))
    // Simplified stat block path: HP / WP visible, full stats hidden.
    expect((screen.getByLabelText('HP') as HTMLInputElement).value).toBe('8')
    expect((screen.getByLabelText('WP') as HTMLInputElement).value).toBe('6')

    const user = userEvent.setup()
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed')
    await user.click(screen.getByRole('button', { name: /save npc/i }))

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/npcs/${NPC_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      ),
    )
  })
})
