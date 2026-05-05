import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { ClueRow } from '../../api/clues'
import type { EdgeRow } from '../../api/edges'
import { clueKeys } from '../../hooks/useClues'
import { edgeKeys } from '../../hooks/useEdges'
import { sessionKeys } from '../../hooks/useSessions'
import ClueDetailPage from './ClueDetailPage'

const CLUE_ID = 'clue-1'

function makeClue(overrides: Partial<ClueRow> = {}): ClueRow {
  return {
    id: CLUE_ID,
    campaignId: null,
    name: 'Bloodstained letter',
    description: 'Found at the scene.',
    originScenarioId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeEdge(overrides: Partial<EdgeRow> = {}): EdgeRow {
  return {
    id: 'edge-x',
    sourceType: 'clue',
    sourceId: CLUE_ID,
    targetType: 'npc',
    targetId: 'npc-target',
    kind: 'mentions',
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(opts: { clue?: ClueRow; edges?: EdgeRow[] }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (opts.clue) {
    qc.setQueryData(clueKeys.detail(CLUE_ID), opts.clue)
  }
  qc.setQueryData(edgeKeys.list({ sourceType: 'clue', sourceId: CLUE_ID }), opts.edges ?? [])
  // EntityRelationships also queries incoming edges; seed empty.
  qc.setQueryData(edgeKeys.list({ targetType: 'clue', targetId: CLUE_ID }), [])
  qc.setQueryData(sessionKeys.list('realWorld', { involvesType: 'clue', involvesId: CLUE_ID }), [])
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/clues/${CLUE_ID}`]}>
        <Routes>
          <Route path="/clues/:id" element={<ClueDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ClueDetailPage', () => {
  it('renders outgoing edges grouped by target type', () => {
    renderPage({
      clue: makeClue(),
      edges: [
        makeEdge({ id: 'e1', targetType: 'npc', targetId: 'npc-1', kind: 'mentions' }),
        makeEdge({ id: 'e2', targetType: 'faction', targetId: 'faction-1', kind: 'implicates' }),
        makeEdge({ id: 'e3', targetType: 'location', targetId: 'location-1', kind: 'points_to' }),
      ],
    })

    expect(screen.getByRole('heading', { name: /linked npcs/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /linked factions/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /linked locations/i })).toBeInTheDocument()

    // The curated "Linked entities" card and the generic Relationships
    // card both render a link to each related entity, so we expect at
    // least one match. Verify the curated section's link href.
    expect(screen.getAllByRole('link', { name: 'npc-1' })[0]).toHaveAttribute('href', '/npcs/npc-1')
    expect(screen.getAllByRole('link', { name: 'faction-1' })[0]).toHaveAttribute(
      'href',
      '/factions/faction-1',
    )
    expect(screen.getAllByRole('link', { name: 'location-1' })[0]).toHaveAttribute(
      'href',
      '/locations/location-1',
    )

    // Three "Remove" buttons (one per edge) — the generic Relationships
    // card is read-only, so no extra remove buttons are introduced.
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    expect(removeButtons).toHaveLength(3)
  })

  it('renders the origin scenario as an em-dash when absent', () => {
    renderPage({ clue: makeClue({ originScenarioId: null }), edges: [] })
    const heading = screen.getByRole('heading', { name: /origin scenario/i })
    expect(heading.nextElementSibling?.textContent).toBe('—')
  })

  it('renders the origin scenario as a link when present', () => {
    renderPage({ clue: makeClue({ originScenarioId: 'scen-42' }), edges: [] })
    const link = screen.getByRole('link', { name: 'scen-42' })
    expect(link).toHaveAttribute('href', '/scenarios/scen-42')
  })
})
