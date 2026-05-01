import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { BondRow, BondWithEvents } from '../../api/bonds'
import type { SanChangeEvent } from '../../api/sanity'
import { bondKeys } from '../../hooks/useBonds'
import { pcKeys } from '../../hooks/usePcs'
import { sanityKeys } from '../../hooks/useSanity'
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
    adaptedTo: [],
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
  sanEvents?: SanChangeEvent[]
}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (opts.pc) qc.setQueryData(pcKeys.detail(PC_ID), opts.pc)
  qc.setQueryData(bondKeys.list({ pcId: PC_ID }), opts.bonds ?? [])
  qc.setQueryData(bondKeys.list({ targetType: 'pc', targetId: PC_ID }), opts.incomingBonds ?? [])
  if (opts.bondDetail) {
    qc.setQueryData(bondKeys.detail(opts.bondDetail.bond.id), opts.bondDetail)
  }
  qc.setQueryData(sanityKeys.events(PC_ID), opts.sanEvents ?? [])
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

  it('renders the Sanity section with current/max value and progress bar', () => {
    renderPage({
      pc: makePc({ sanityCurrent: 45, sanMax: 65, breakingPoints: [52, 39, 26, 13] }),
    })
    expect(screen.getByRole('heading', { name: /^sanity$/i })).toBeInTheDocument()
    expect(screen.getByText(/45 \/ 65/)).toBeInTheDocument()
    const bar = screen.getByRole('progressbar', { name: /sanity/i })
    expect(bar).toHaveAttribute('aria-valuenow', '45')
    expect(bar).toHaveAttribute('aria-valuemax', '65')
  })

  it('renders the breaking-points list and apply-change form', () => {
    renderPage({
      pc: makePc({ sanityCurrent: 50, sanMax: 65, breakingPoints: [52, 39, 26, 13] }),
    })
    expect(screen.getByText('52')).toBeInTheDocument()
    expect(screen.getByText('39')).toBeInTheDocument()
    expect(screen.getByLabelText(/^source$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^loss$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^gain$/i })).toBeInTheDocument()
  })

  it('renders the "Download as Markdown" link pointing at the export endpoint', () => {
    renderPage({ pc: makePc() })
    const link = screen.getByRole('link', { name: /download as markdown/i })
    expect(link).toHaveAttribute('href', `/api/pcs/${PC_ID}/export`)
    expect(link).toHaveAttribute('download')
  })

  it('renders a crossed-threshold badge on a seeded SAN event', () => {
    renderPage({
      pc: makePc({ sanityCurrent: 38, sanMax: 65, breakingPoints: [52, 39, 26, 13] }),
      sanEvents: [
        {
          id: 'sce-1',
          pcId: PC_ID,
          delta: -12,
          source: 'saw the deep one',
          sessionId: null,
          crossedThresholds: [39],
          appliedAt: '2026-04-01T00:00:00Z',
        },
      ],
    })
    expect(screen.getByText(/saw the deep one/)).toBeInTheDocument()
    expect(screen.getByText(/crossed 39/)).toBeInTheDocument()
  })
})
