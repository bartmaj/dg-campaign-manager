import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { BondRow, BondWithEvents } from '../../api/bonds'
import { bondKeys } from '../../hooks/useBonds'
import { pcKeys } from '../../hooks/usePcs'
import type { PcRow } from '../../api/pcs'
import PcDetailPage from './PcDetailPage'

const PC_ID = 'pc-1'

function makePc(overrides: Partial<PcRow> = {}): PcRow {
  return {
    id: PC_ID,
    campaignId: null,
    name: 'Agent Smith',
    description: null,
    profession: 'Special Agent',
    str: 10,
    con: 10,
    dex: 10,
    intelligence: 10,
    pow: 10,
    cha: 12,
    hp: 10,
    wp: 10,
    bp: 6,
    sanMax: 50,
    skills: [],
    motivations: [],
    backstoryHooks: null,
    sanityCurrent: 50,
    sanityDisorders: [],
    breakingPoints: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as PcRow
}

function makeBond(overrides: Partial<BondRow> = {}): BondRow {
  return {
    id: 'bond-1',
    pcId: PC_ID,
    name: 'Sister Mary',
    currentScore: 9,
    maxScore: 12,
    targetType: 'npc',
    targetId: 'npc-target',
    description: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage(opts: {
  pc?: PcRow
  bonds?: BondRow[]
  bondDetail?: BondWithEvents
  incomingBonds?: BondRow[]
}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (opts.pc) qc.setQueryData(pcKeys.detail(PC_ID), opts.pc)
  qc.setQueryData(bondKeys.list({ pcId: PC_ID }), opts.bonds ?? [])
  qc.setQueryData(bondKeys.list({ targetType: 'pc', targetId: PC_ID }), opts.incomingBonds ?? [])
  if (opts.bondDetail) {
    qc.setQueryData(bondKeys.detail(opts.bondDetail.bond.id), opts.bondDetail)
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/pcs/${PC_ID}`]}>
        <Routes>
          <Route path="/pcs/:id" element={<PcDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PcDetailPage', () => {
  it('renders the bonds section with current/max and target link', () => {
    renderPage({
      pc: makePc(),
      bonds: [makeBond({ name: 'Sister Mary', currentScore: 9, maxScore: 12 })],
    })

    expect(screen.getByRole('heading', { name: /^bonds$/i })).toBeInTheDocument()
    expect(screen.getByText(/Sister Mary/)).toBeInTheDocument()
    expect(screen.getByText(/9 \/ 12/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /npc: npc-target/i })).toHaveAttribute(
      'href',
      '/npcs/npc-target',
    )
  })

  it('renders an empty state when the PC has no bonds', () => {
    renderPage({ pc: makePc(), bonds: [] })
    expect(screen.getByText('No bonds yet.')).toBeInTheDocument()
  })

  it('renders the "Add Bond" form', () => {
    renderPage({ pc: makePc(), bonds: [] })
    expect(screen.getByRole('button', { name: /add bond/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/target id/i)).toBeInTheDocument()
  })

  it('renders incoming bonds (PC↔PC) under "Bonds with this character"', () => {
    renderPage({
      pc: makePc(),
      bonds: [],
      incomingBonds: [
        makeBond({ id: 'b-incoming', pcId: 'pc-other', name: 'My buddy', targetType: 'pc' }),
      ],
    })
    expect(screen.getByRole('heading', { name: /bonds with this character/i })).toBeInTheDocument()
    expect(screen.getByText(/My buddy/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'pc-other' })).toHaveAttribute('href', '/pcs/pc-other')
  })
})
