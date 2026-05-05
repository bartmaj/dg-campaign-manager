import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { EdgeRow } from '../../api/edges'
import { edgeKeys } from '../../hooks/useEdges'
import { entityNameKeys } from '../../hooks/useEntityNames'
import EntityRelationships from './EntityRelationships'

const ENTITY_ID = 'npc-focal'

function makeEdge(overrides: Partial<EdgeRow> = {}): EdgeRow {
  return {
    id: 'edge-x',
    sourceType: 'clue',
    sourceId: 'clue-1',
    targetType: 'npc',
    targetId: ENTITY_ID,
    kind: 'mentions',
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

type SeedOpts = {
  outgoing?: EdgeRow[]
  incoming?: EdgeRow[]
  // Pre-seeded `(type, sortedIds) -> {items}` name lookups.
  names?: Array<{
    type: 'npc' | 'clue' | 'faction' | 'location'
    ids: string[]
    rows: Array<{ id: string; name: string }>
  }>
}

function renderRelationships(opts: SeedOpts) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(edgeKeys.list({ sourceType: 'npc', sourceId: ENTITY_ID }), opts.outgoing ?? [])
  qc.setQueryData(edgeKeys.list({ targetType: 'npc', targetId: ENTITY_ID }), opts.incoming ?? [])
  for (const n of opts.names ?? []) {
    qc.setQueryData(entityNameKeys.list(n.type, [...n.ids].sort()), { items: n.rows })
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <EntityRelationships entityType="npc" entityId={ENTITY_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EntityRelationships', () => {
  it('renders the EmptyState when there are no incoming or outgoing edges', () => {
    renderRelationships({ outgoing: [], incoming: [] })
    expect(screen.getByRole('heading', { name: /relationships/i })).toBeInTheDocument()
    expect(screen.getByText(/no typed relationships yet/i)).toBeInTheDocument()
  })

  it('groups outgoing edges by other-type and renders a Link for each', () => {
    renderRelationships({
      outgoing: [
        makeEdge({
          id: 'e1',
          sourceType: 'npc',
          sourceId: ENTITY_ID,
          targetType: 'location',
          targetId: 'loc-1',
          kind: 'occupies',
        }),
      ],
      incoming: [],
      names: [
        { type: 'location', ids: ['loc-1'], rows: [{ id: 'loc-1', name: 'The Lighthouse' }] },
      ],
    })
    expect(screen.getByRole('heading', { name: /^outgoing$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /locations/i })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'The Lighthouse' })
    expect(link).toHaveAttribute('href', '/locations/loc-1')
  })

  it('groups incoming edges and shows the kind as a Badge', () => {
    renderRelationships({
      outgoing: [],
      incoming: [makeEdge({ id: 'e1', sourceType: 'clue', sourceId: 'clue-7', kind: 'mentions' })],
      names: [{ type: 'clue', ids: ['clue-7'], rows: [{ id: 'clue-7', name: 'Bloody letter' }] }],
    })
    const incomingHeading = screen.getByRole('heading', { name: /^incoming$/i })
    expect(incomingHeading).toBeInTheDocument()
    expect(screen.getByText('mentions')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Bloody letter' })
    expect(link).toHaveAttribute('href', '/clues/clue-7')
  })

  it('falls back to the raw id (mono span) while names are loading', () => {
    // No names seeded -> name lookup returns nothing initially; the
    // component renders the id directly.
    renderRelationships({
      outgoing: [],
      incoming: [
        makeEdge({ id: 'e1', sourceType: 'clue', sourceId: 'clue-unknown', kind: 'mentions' }),
      ],
    })
    const incomingHeading = screen.getByRole('heading', { name: /^incoming$/i })
    const incomingScope = incomingHeading.parentElement as HTMLElement
    // The `clue-unknown` id appears as fallback text inside the link.
    expect(within(incomingScope).getByText('clue-unknown')).toBeInTheDocument()
  })
})
