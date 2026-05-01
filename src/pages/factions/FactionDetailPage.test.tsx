import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { EdgeRow } from '../../api/edges'
import type { FactionRow } from '../../api/factions'
import { edgeKeys } from '../../hooks/useEdges'
import { factionKeys } from '../../hooks/useFactions'
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
    const link = screen.getByRole('link', { name: 'clue-abc' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/clues/clue-abc')
  })

  it('shows an empty state when there are no implicating clues', () => {
    renderPage({ faction: makeFaction(), edges: [] })
    const heading = screen.getByRole('heading', { name: /implicating clues/i })
    expect(heading).toBeInTheDocument()
    // Empty state: a single em-dash paragraph follows the heading.
    expect(heading.nextElementSibling?.textContent).toBe('—')
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
    expect(screen.getByRole('link', { name: 'clue-1' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'clue-2' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'npc-1' })).not.toBeInTheDocument()
  })
})
