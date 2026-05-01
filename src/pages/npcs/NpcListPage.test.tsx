import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { NpcRow } from '../../api/npcs'
import { factionKeys } from '../../hooks/useFactions'
import { npcKeys } from '../../hooks/useNpcs'
import NpcListPage from './NpcListPage'

function makeNpc(overrides: Partial<NpcRow> = {}): NpcRow {
  return {
    id: 'npc-x',
    campaignId: 'c1',
    name: 'Default NPC',
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
    locationId: null,
    currentGoal: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const FACTION_A = {
  id: 'faction-a',
  campaignId: 'c1',
  name: 'Faction Alpha',
  description: null,
  agenda: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}
const FACTION_B = {
  id: 'faction-b',
  campaignId: 'c1',
  name: 'Faction Beta',
  description: null,
  agenda: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const NPC_IN_A = makeNpc({ id: 'n1', name: 'Alice', factionId: 'faction-a' })
const NPC_IN_B = makeNpc({ id: 'n2', name: 'Bob', factionId: 'faction-b' })

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // Seed both list variants — unfiltered (initial render) and the
  // filter-by-faction-A variant the user will switch to.
  qc.setQueryData(npcKeys.list({}), [NPC_IN_A, NPC_IN_B])
  qc.setQueryData(npcKeys.list({ factionId: 'faction-a' }), [NPC_IN_A])
  qc.setQueryData(factionKeys.list({}), [FACTION_A, FACTION_B])
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NpcListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function listedNames(): string[] {
  return screen
    .getAllByRole('link')
    .filter((a) => /^\/npcs\/n\d+$/.test(a.getAttribute('href') ?? ''))
    .map((a) => a.textContent ?? '')
}

describe('NpcListPage', () => {
  it('shows all NPCs by default', () => {
    renderPage()
    expect(listedNames()).toEqual(['Alice', 'Bob'])
  })

  it('filters NPCs to selected faction', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.selectOptions(screen.getByLabelText('Faction'), 'faction-a')
    expect(listedNames()).toEqual(['Alice'])
  })
})
