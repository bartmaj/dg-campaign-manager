import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { EdgeRow } from '../../api/edges'
import type { FactionStatusEvent } from '../../api/factionStatus'
import type { NpcRow } from '../../api/npcs'
import { edgeKeys } from '../../hooks/useEdges'
import { entityNameKeys } from '../../hooks/useEntityNames'
import { factionStatusKeys } from '../../hooks/useFactionStatus'
import { npcKeys } from '../../hooks/useNpcs'
import FactionContext from './FactionContext'

const FACTION_ID = 'faction-focal'

vi.mock('../../api/factionStatus', async () => {
  const actual =
    await vi.importActual<typeof import('../../api/factionStatus')>('../../api/factionStatus')
  return {
    ...actual,
    createFactionStatus: vi.fn(),
    deleteFactionStatus: vi.fn(),
  }
})

import { createFactionStatus } from '../../api/factionStatus'

function makeStatus(overrides: Partial<FactionStatusEvent> = {}): FactionStatusEvent {
  return {
    id: 'evt-1',
    factionId: FACTION_ID,
    note: 'Leadership reshuffle.',
    occurredAt: '2026-02-01T00:00:00Z',
    sessionId: null,
    createdAt: '2026-02-01T00:00:00Z',
    ...overrides,
  }
}

function makeEdge(overrides: Partial<EdgeRow> = {}): EdgeRow {
  return {
    id: 'edge-x',
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

function makeNpc(overrides: Partial<NpcRow> = {}): NpcRow {
  return {
    id: 'npc-1',
    campaignId: null,
    name: 'Agent Smith',
    description: null,
    factionId: FACTION_ID,
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
    locationId: null,
    currentGoal: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

type SeedOpts = {
  status?: FactionStatusEvent[]
  incoming?: EdgeRow[]
  npcs?: NpcRow[]
  names?: Array<{
    type: 'npc' | 'clue'
    ids: string[]
    rows: Array<{ id: string; name: string }>
  }>
}

function renderContext(opts: SeedOpts) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(factionStatusKeys.list(FACTION_ID), opts.status ?? [])
  qc.setQueryData(npcKeys.list({ factionId: FACTION_ID }), opts.npcs ?? [])
  qc.setQueryData(
    edgeKeys.list({ targetType: 'faction', targetId: FACTION_ID }),
    opts.incoming ?? [],
  )
  for (const n of opts.names ?? []) {
    qc.setQueryData(entityNameKeys.list(n.type, [...n.ids].sort()), { items: n.rows })
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FactionContext factionId={FACTION_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FactionContext', () => {
  it('renders all three panels with empty states when nothing is recorded', () => {
    renderContext({})
    expect(screen.getByRole('heading', { name: /status timeline/i })).toBeInTheDocument()
    expect(screen.getByText('No status changes recorded yet.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^members$/i })).toBeInTheDocument()
    expect(screen.getByText('No members listed.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /implicating clues/i })).toBeInTheDocument()
    expect(screen.getByText('No clues implicate this faction.')).toBeInTheDocument()
  })

  it('renders status events sorted by occurredAt ascending', () => {
    renderContext({
      status: [
        makeStatus({
          id: 'late',
          note: 'Splinter cell forms.',
          occurredAt: '2026-04-01T00:00:00Z',
        }),
        makeStatus({
          id: 'early',
          note: 'Founded in secret.',
          occurredAt: '2026-01-15T00:00:00Z',
        }),
      ],
    })
    const heading = screen.getByRole('heading', { name: /status timeline/i })
    const card = heading.parentElement as HTMLElement
    const items = within(card).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Founded in secret.')
    expect(items[1]).toHaveTextContent('Splinter cell forms.')
    expect(within(card).getByText('2026-01-15')).toBeInTheDocument()
  })

  it('merges FK and edge-linked members and dedupes by id (FK wins)', () => {
    renderContext({
      npcs: [makeNpc({ id: 'npc-a', name: 'Alice' })],
      incoming: [
        // Same NPC also surfaces as 'member_of' — must NOT duplicate.
        makeEdge({
          id: 'm1',
          sourceType: 'npc',
          sourceId: 'npc-a',
          kind: 'member_of',
        }),
        // Edge-only NPC.
        makeEdge({
          id: 'm2',
          sourceType: 'npc',
          sourceId: 'npc-b',
          kind: 'member_of',
        }),
      ],
      names: [{ type: 'npc', ids: ['npc-b'], rows: [{ id: 'npc-b', name: 'Bob' }] }],
    })
    const heading = screen.getByRole('heading', { name: /^members$/i })
    const scope = heading.parentElement as HTMLElement
    const aliceLinks = within(scope).getAllByRole('link', { name: 'Alice' })
    expect(aliceLinks).toHaveLength(1)
    expect(aliceLinks[0]).toHaveAttribute('href', '/npcs/npc-a')
    expect(within(scope).getByText('current member')).toBeInTheDocument()
    const bobLink = within(scope).getByRole('link', { name: 'Bob' })
    expect(bobLink).toHaveAttribute('href', '/npcs/npc-b')
    expect(within(scope).getByText('linked')).toBeInTheDocument()
  })

  it('renders implicating clues from incoming clue→faction implicates edges', () => {
    renderContext({
      incoming: [
        makeEdge({
          id: 'e1',
          sourceType: 'clue',
          sourceId: 'clue-7',
          kind: 'implicates',
          notes: 'Letter found at site',
        }),
        // Wrong kind — filtered out:
        makeEdge({
          id: 'e2',
          sourceType: 'clue',
          sourceId: 'clue-8',
          kind: 'mentions',
        }),
      ],
      names: [{ type: 'clue', ids: ['clue-7'], rows: [{ id: 'clue-7', name: 'Bloody letter' }] }],
    })
    const heading = screen.getByRole('heading', { name: /implicating clues/i })
    const scope = heading.parentElement as HTMLElement
    const link = within(scope).getByRole('link', { name: 'Bloody letter' })
    expect(link).toHaveAttribute('href', '/clues/clue-7')
    expect(within(scope).getByText(/Letter found at site/)).toBeInTheDocument()
    expect(within(scope).queryByText(/clue-8/)).not.toBeInTheDocument()
  })

  it('renders the add-status-note form and calls the create mutation on submit', async () => {
    const user = userEvent.setup()
    const created: FactionStatusEvent = makeStatus({
      id: 'new-evt',
      note: 'Sigil seen at meeting.',
      occurredAt: '2026-04-30T00:00:00Z',
    })
    vi.mocked(createFactionStatus).mockResolvedValue(created)

    renderContext({})

    const dateInput = screen.getByLabelText('Date')
    const noteInput = screen.getByLabelText('Note')
    await user.type(dateInput, '2026-04-30')
    await user.type(noteInput, 'Sigil seen at meeting.')

    const addBtn = screen.getByRole('button', { name: 'Add' })
    expect(addBtn).not.toBeDisabled()
    await user.click(addBtn)

    expect(createFactionStatus).toHaveBeenCalledTimes(1)
    const call = vi.mocked(createFactionStatus).mock.calls[0]?.[0]
    expect(call?.factionId).toBe(FACTION_ID)
    expect(call?.note).toBe('Sigil seen at meeting.')
    expect(call?.occurredAt).toMatch(/^2026-04-30T00:00:00/)
  })
})
