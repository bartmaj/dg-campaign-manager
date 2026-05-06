import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { SessionRow } from '../../api/sessions'
import { sessionKeys } from '../../hooks/useSessions'
import EntityRecentActivity from './EntityRecentActivity'

const NPC_ID = 'npc-focal'

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
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderActivity(sessions: SessionRow[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(
    sessionKeys.list('realWorld', { involvesType: 'npc', involvesId: NPC_ID }),
    sessions,
  )
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <EntityRecentActivity entityType="npc" entityId={NPC_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EntityRecentActivity', () => {
  it('renders the EmptyState when no sessions involve this entity', () => {
    renderActivity([])
    expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument()
    expect(screen.getByText(/no session activity yet/i)).toBeInTheDocument()
  })

  it('renders sessions sorted with most recent IRL date first; nulls last', () => {
    renderActivity([
      makeSession({ id: 'sess-old', name: 'Old Session', realWorldDate: '2026-01-15T00:00:00Z' }),
      makeSession({ id: 'sess-undated', name: 'Undated Session', realWorldDate: null }),
      makeSession({ id: 'sess-new', name: 'New Session', realWorldDate: '2026-03-15T00:00:00Z' }),
    ])
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('New Session')
    expect(links[1]).toHaveTextContent('Old Session')
    expect(links[2]).toHaveTextContent('Undated Session')
    expect(links[0]).toHaveAttribute('href', '/sessions/sess-new')
  })
})
