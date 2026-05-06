import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { EdgeRow } from '../../api/edges'
import type { ItemRow } from '../../api/items'
import type { NpcRow } from '../../api/npcs'
import type { SessionRow } from '../../api/sessions'
import { edgeKeys } from '../../hooks/useEdges'
import { entityNameKeys } from '../../hooks/useEntityNames'
import { itemKeys } from '../../hooks/useItems'
import { npcKeys } from '../../hooks/useNpcs'
import { sessionKeys } from '../../hooks/useSessions'
import LocationContext from './LocationContext'

const LOC_ID = 'loc-focal'

function makeEdge(overrides: Partial<EdgeRow> = {}): EdgeRow {
  return {
    id: 'edge-x',
    sourceType: 'clue',
    sourceId: 'clue-1',
    targetType: 'location',
    targetId: LOC_ID,
    kind: 'points_to',
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeNpc(overrides: Partial<NpcRow> = {}): NpcRow {
  return {
    id: 'npc-1',
    campaignId: null,
    name: 'Agent Smith',
    description: null,
    factionId: null,
    profession: null,
    str: null,
    con: null,
    dex: null,
    intelligence: null,
    pow: null,
    cha: null,
    hp: null,
    wp: null,
    mannerisms: null,
    voice: null,
    secrets: null,
    status: 'alive',
    locationId: LOC_ID,
    currentGoal: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeItem(overrides: Partial<ItemRow> = {}): ItemRow {
  return {
    id: 'item-1',
    campaignId: null,
    name: 'Brass key',
    description: null,
    history: null,
    ownerNpcId: null,
    locationId: LOC_ID,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 'sess-1',
    campaignId: 'camp-1',
    name: 'Session One',
    description: null,
    inGameDate: null,
    inGameDateEnd: null,
    realWorldDate: null,
    notes: null,
    playerNotes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

type SeedOpts = {
  incoming?: EdgeRow[]
  npcs?: NpcRow[]
  items?: ItemRow[]
  sessions?: SessionRow[]
  names?: Array<{
    type: 'npc' | 'clue' | 'faction' | 'location'
    ids: string[]
    rows: Array<{ id: string; name: string }>
  }>
}

function renderContext(opts: SeedOpts) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(edgeKeys.list({ targetType: 'location', targetId: LOC_ID }), opts.incoming ?? [])
  qc.setQueryData(npcKeys.list({ locationId: LOC_ID }), opts.npcs ?? [])
  qc.setQueryData(itemKeys.list({ locationId: LOC_ID }), opts.items ?? [])
  qc.setQueryData(
    sessionKeys.list('realWorld', { involvesType: 'location', involvesId: LOC_ID }),
    opts.sessions ?? [],
  )
  for (const n of opts.names ?? []) {
    qc.setQueryData(entityNameKeys.list(n.type, [...n.ids].sort()), { items: n.rows })
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LocationContext locationId={LOC_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LocationContext', () => {
  it('renders all four panels with empty states when nothing is linked', () => {
    renderContext({})
    expect(screen.getByRole('heading', { name: /linked clues/i })).toBeInTheDocument()
    expect(screen.getByText('No clues linked.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /present npcs/i })).toBeInTheDocument()
    expect(screen.getByText('No NPCs here.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /items at this location/i })).toBeInTheDocument()
    expect(screen.getByText('No items recorded.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /sessions at this location/i })).toBeInTheDocument()
    expect(screen.getByText('No session activity yet.')).toBeInTheDocument()
  })

  it('renders linked clues from incoming clue→location points_to edges', () => {
    renderContext({
      incoming: [
        makeEdge({
          id: 'e1',
          sourceType: 'clue',
          sourceId: 'clue-7',
          kind: 'points_to',
          notes: 'mentioned in Letter B',
        }),
        // Non-points_to edge from a clue should be filtered out:
        makeEdge({
          id: 'e2',
          sourceType: 'clue',
          sourceId: 'clue-8',
          kind: 'mentions',
        }),
      ],
      names: [{ type: 'clue', ids: ['clue-7'], rows: [{ id: 'clue-7', name: 'Bloody letter' }] }],
    })
    const link = screen.getByRole('link', { name: 'Bloody letter' })
    expect(link).toHaveAttribute('href', '/clues/clue-7')
    expect(screen.queryByText(/clue-8/)).not.toBeInTheDocument()
  })

  it('merges FK and edge-linked NPCs and dedupes by id (FK linkage wins)', () => {
    const fkNpc = makeNpc({ id: 'npc-a', name: 'Alice' })
    renderContext({
      npcs: [fkNpc],
      incoming: [
        // Same NPC also linked via 'occupies' edge — must NOT duplicate.
        makeEdge({
          id: 'e1',
          sourceType: 'npc',
          sourceId: 'npc-a',
          kind: 'occupies',
        }),
        // Different NPC, edge-only via 'frequents'.
        makeEdge({
          id: 'e2',
          sourceType: 'npc',
          sourceId: 'npc-b',
          kind: 'frequents',
        }),
      ],
      names: [{ type: 'npc', ids: ['npc-b'], rows: [{ id: 'npc-b', name: 'Bob' }] }],
    })
    const presentHeading = screen.getByRole('heading', { name: /present npcs/i })
    const scope = presentHeading.parentElement as HTMLElement
    const aliceLinks = within(scope).getAllByRole('link', { name: 'Alice' })
    expect(aliceLinks).toHaveLength(1)
    expect(aliceLinks[0]).toHaveAttribute('href', '/npcs/npc-a')
    expect(within(scope).getByText('current location')).toBeInTheDocument()

    const bobLink = within(scope).getByRole('link', { name: 'Bob' })
    expect(bobLink).toHaveAttribute('href', '/npcs/npc-b')
    expect(within(scope).getByText('frequents')).toBeInTheDocument()
  })

  it('renders items at the location with optional owner enrichment', () => {
    renderContext({
      items: [
        makeItem({ id: 'item-1', name: 'Brass key', ownerNpcId: 'npc-owner' }),
        makeItem({ id: 'item-2', name: 'Stained map', ownerNpcId: null }),
      ],
      names: [
        { type: 'npc', ids: ['npc-owner'], rows: [{ id: 'npc-owner', name: 'Quartermaster' }] },
      ],
    })
    const itemsHeading = screen.getByRole('heading', { name: /items at this location/i })
    const scope = itemsHeading.parentElement as HTMLElement
    expect(within(scope).getByRole('link', { name: 'Brass key' })).toHaveAttribute(
      'href',
      '/items/item-1',
    )
    expect(within(scope).getByText(/held by Quartermaster/)).toBeInTheDocument()
    expect(within(scope).getByRole('link', { name: 'Stained map' })).toBeInTheDocument()
  })

  it('renders sessions at this location sorted most-recent first', () => {
    renderContext({
      sessions: [
        makeSession({ id: 'sess-old', name: 'Old', realWorldDate: '2026-01-15T00:00:00Z' }),
        makeSession({ id: 'sess-new', name: 'New', realWorldDate: '2026-03-15T00:00:00Z' }),
        makeSession({ id: 'sess-undated', name: 'Undated', realWorldDate: null }),
      ],
    })
    const sessionsHeading = screen.getByRole('heading', { name: /sessions at this location/i })
    const scope = sessionsHeading.parentElement as HTMLElement
    const links = within(scope).getAllByRole('link')
    expect(links[0]).toHaveTextContent('New')
    expect(links[1]).toHaveTextContent('Old')
    expect(links[2]).toHaveTextContent('Undated')
  })
})
