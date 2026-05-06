import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { NpcRow } from '../../api/npcs'
import { bondKeys } from '../../hooks/useBonds'
import { edgeKeys } from '../../hooks/useEdges'
import { npcKeys } from '../../hooks/useNpcs'
import { sessionKeys } from '../../hooks/useSessions'
import type { EdgeRow } from '../../api/edges'
import type { SessionRow } from '../../api/sessions'
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

type RenderOpts = {
  outgoingEdges?: EdgeRow[]
  incomingEdges?: EdgeRow[]
  sessions?: SessionRow[]
}

function renderPage(npc: NpcRow, opts: RenderOpts = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(npcKeys.detail(NPC_ID), npc)
  qc.setQueryData(bondKeys.list({ targetType: 'npc', targetId: NPC_ID }), [])
  // Pre-seed both edge directions and the sessions-involving query the
  // EntityRelationships + EntityRecentActivity components consume.
  qc.setQueryData(edgeKeys.list({ targetType: 'npc', targetId: NPC_ID }), opts.incomingEdges ?? [])
  qc.setQueryData(edgeKeys.list({ sourceType: 'npc', sourceId: NPC_ID }), opts.outgoingEdges ?? [])
  qc.setQueryData(
    sessionKeys.list('realWorld', { involvesType: 'npc', involvesId: NPC_ID }),
    opts.sessions ?? [],
  )
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

  it('renders the Relationships and Recent activity sections (REQ-015)', () => {
    renderPage(makeNpc(), {
      incomingEdges: [
        {
          id: 'e1',
          sourceType: 'clue',
          sourceId: 'clue-1',
          targetType: 'npc',
          targetId: NPC_ID,
          kind: 'mentions',
          notes: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      sessions: [
        {
          id: 'sess-1',
          campaignId: 'camp-1',
          name: 'Op: Black Goat',
          description: null,
          inGameDate: null,
          inGameDateEnd: null,
          realWorldDate: '2026-02-01T00:00:00Z',
          notes: null,
          playerNotes: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    })
    expect(screen.getByRole('heading', { name: /relationships/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Op: Black Goat' })).toHaveAttribute(
      'href',
      '/sessions/sess-1',
    )
  })

  it('renders the Delete button in the toolbar', () => {
    renderPage(makeNpc())
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })
})
