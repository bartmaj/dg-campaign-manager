import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { NpcRow } from '../../api/npcs'
import { bondKeys } from '../../hooks/useBonds'
import { edgeKeys } from '../../hooks/useEdges'
import { npcKeys } from '../../hooks/useNpcs'
import NpcDetailPage from './NpcDetailPage'

const NPC_ID = 'npc-1'

function makeNpc(overrides: Partial<NpcRow> = {}): NpcRow {
  return {
    id: NPC_ID,
    campaignId: null,
    name: 'Agent Marlow',
    description: null,
    factionId: null,
    profession: 'Federal Agent',
    str: null,
    con: null,
    dex: null,
    intelligence: null,
    pow: null,
    cha: null,
    hp: 12,
    wp: 11,
    mannerisms: null,
    voice: null,
    secrets: null,
    status: 'alive',
    locationId: null,
    currentGoal: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(npc: NpcRow) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(npcKeys.detail(NPC_ID), npc)
  qc.setQueryData(bondKeys.list({ targetType: 'npc', targetId: NPC_ID }), [])
  // useIncomingEdges falls back to listEdges; pre-seed an empty list to
  // avoid network calls during the smoke test.
  qc.setQueryData(edgeKeys.list({ targetType: 'npc', targetId: NPC_ID }), [])
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/npcs/${NPC_ID}`]}>
        <Routes>
          <Route path="/npcs/:id" element={<NpcDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NpcDetailPage', () => {
  it('renders the "Download as Markdown" link pointing at the export endpoint', () => {
    renderPage(makeNpc())
    const link = screen.getByRole('link', { name: /download as markdown/i })
    expect(link).toHaveAttribute('href', `/api/npcs/${NPC_ID}/export`)
    expect(link).toHaveAttribute('download')
  })
})
