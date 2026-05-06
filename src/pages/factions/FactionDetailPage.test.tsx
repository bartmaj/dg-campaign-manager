import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { EdgeRow } from '../../api/edges'
import type { FactionRow } from '../../api/factions'
import { edgeKeys } from '../../hooks/useEdges'
import { entityNameKeys } from '../../hooks/useEntityNames'
import { factionKeys } from '../../hooks/useFactions'
import { factionStatusKeys } from '../../hooks/useFactionStatus'
import { npcKeys } from '../../hooks/useNpcs'
import { sessionKeys } from '../../hooks/useSessions'
import FactionDetailPage from './FactionDetailPage'

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

function makeEdge(overrides: Partial<EdgeRow> = {}): EdgeRow {
  return {
    id: 'edge-1',
    sourceType: 'clue',
    sourceId: 'clue-1',
    targetType: 'faction',
    targetId: FACTION_ID,
    kind: 'implicates',
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(opts: { faction?: FactionRow; edges?: EdgeRow[] }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (opts.faction) {
    qc.setQueryData(factionKeys.detail(FACTION_ID), opts.faction)
  }
  // Prime the same query key the hook uses so React Query returns the
  // seeded data instead of fetching.
  qc.setQueryData(edgeKeys.list({ targetType: 'faction', targetId: FACTION_ID }), opts.edges ?? [])
  // EntityRelationships also queries outgoing edges; seed empty.
  qc.setQueryData(edgeKeys.list({ sourceType: 'faction', sourceId: FACTION_ID }), [])
  // EntityRecentActivity queries sessions involving this entity; seed empty.
  qc.setQueryData(
    sessionKeys.list('realWorld', { involvesType: 'faction', involvesId: FACTION_ID }),
    [],
  )
  // FactionContext panels (#020): status timeline + members.
  qc.setQueryData(factionStatusKeys.list(FACTION_ID), [])
  qc.setQueryData(npcKeys.list({ factionId: FACTION_ID }), [])
  // Resolve clue names for implicating-clues entries (one per seeded edge).
  const clueIds = (opts.edges ?? [])
    .filter((e) => e.sourceType === 'clue' && e.kind === 'implicates')
    .map((e) => e.sourceId)
  if (clueIds.length > 0) {
    qc.setQueryData(entityNameKeys.list('clue', [...clueIds].sort()), {
      items: clueIds.map((id) => ({ id, name: id })),
    })
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/factions/${FACTION_ID}`]}>
        <Routes>
          <Route path="/factions/:id" element={<FactionDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FactionDetailPage', () => {
  it('renders the "Implicating clues" section with seeded edges', () => {
    renderPage({
      faction: makeFaction(),
      edges: [makeEdge({ id: 'edge-1', sourceId: 'clue-abc' })],
    })
    expect(screen.getByRole('heading', { name: /implicating clues/i })).toBeInTheDocument()
    // Two links — one in the curated "Implicating clues" section, one in
    // the generic Relationships card. Both point to the same clue.
    const links = screen.getAllByRole('link', { name: 'clue-abc' })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute('href', '/clues/clue-abc')
  })

  it('shows an empty state when there are no implicating clues', () => {
    renderPage({ faction: makeFaction(), edges: [] })
    const heading = screen.getByRole('heading', { name: /implicating clues/i })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText('No clues implicate this faction.')).toBeInTheDocument()
  })

  it('ignores incoming edges that are not clue→faction implicates', () => {
    renderPage({
      faction: makeFaction(),
      edges: [
        makeEdge({ id: 'edge-1', sourceId: 'clue-1', kind: 'implicates' }),
        // wrong kind
        makeEdge({
          id: 'edge-2',
          sourceType: 'clue',
          sourceId: 'clue-2',
          kind: 'mentions',
        }),
        // wrong source type (shouldn't normally happen for this target,
        // but we filter defensively).
        makeEdge({
          id: 'edge-3',
          sourceType: 'npc',
          sourceId: 'npc-1',
          kind: 'implicates',
        }),
      ],
    })
    // The curated "Implicating clues" section only includes clue-1; the
    // generic Relationships card surfaces all incoming edges, so the
    // wrong-kind/wrong-type ids appear there.
    const implicatingHeading = screen.getByRole('heading', { name: /implicating clues/i })
    const implicatingCard = implicatingHeading.closest('div')
    expect(implicatingCard).not.toBeNull()
    expect(
      within(implicatingCard as HTMLElement).getByRole('link', { name: 'clue-1' }),
    ).toBeInTheDocument()
    expect(
      within(implicatingCard as HTMLElement).queryByRole('link', { name: 'clue-2' }),
    ).not.toBeInTheDocument()
    expect(
      within(implicatingCard as HTMLElement).queryByRole('link', { name: 'npc-1' }),
    ).not.toBeInTheDocument()
  })

  it('renders the Delete button in the toolbar', () => {
    renderPage({ faction: makeFaction() })
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })
})
