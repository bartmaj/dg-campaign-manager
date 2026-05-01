import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { SearchIndexItem } from '../../../domain/searchMatch'
import { searchIndexQueryKey } from '../../hooks/useSearchIndex'
import { CmdKPalette } from './CmdKPalette'

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="location">{loc.pathname}</div>
}

function renderPalette(items: SearchIndexItem[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(searchIndexQueryKey, { items })
  const utils = render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <CmdKPalette />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return utils
}

const sampleItems: SearchIndexItem[] = [
  { id: 'pc-1', type: 'pc', name: 'Alice Walker' },
  { id: 'npc-1', type: 'npc', name: 'Boris Petrov', subtitle: 'KGB defector' },
  { id: 'scn-1', type: 'scenario', name: 'Convergence' },
]

async function openPalette(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('{Meta>}k{/Meta}')
}

/**
 * The result row splits the name across <mark> and <span> elements for
 * highlighting, so plain `getByText('Alice Walker')` won't match. We
 * search the option's full text content instead.
 */
function queryResultByName(name: string): HTMLElement | null {
  const options = screen.queryAllByRole('option')
  return options.find((el) => (el.textContent ?? '').includes(name)) ?? null
}

async function findResultByName(name: string): Promise<HTMLElement> {
  // Poll briefly via findAllByRole('option') so React state updates settle.
  const options = await screen.findAllByRole('option')
  const match = options.find((el) => (el.textContent ?? '').includes(name))
  if (!match) throw new Error(`No result option contained "${name}"`)
  return match
}

describe('CmdKPalette', () => {
  it('shows the "type at least 3 characters" hint when query is short', async () => {
    const user = userEvent.setup()
    renderPalette(sampleItems)
    await openPalette(user)
    expect(screen.getByText(/type at least 3 characters/i)).toBeInTheDocument()
    await user.keyboard('al')
    // Still shows hint at 2 chars.
    expect(screen.getByText(/type at least 3 characters/i)).toBeInTheDocument()
    expect(queryResultByName('Alice Walker')).toBeNull()
  })

  it('renders matching results once 3+ characters are typed', async () => {
    const user = userEvent.setup()
    renderPalette(sampleItems)
    await openPalette(user)
    await user.keyboard('ali')
    expect(await findResultByName('Alice Walker')).toBeTruthy()
    expect(queryResultByName('Boris Petrov')).toBeNull()
  })

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderPalette(sampleItems)
    await openPalette(user)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('navigates to the result path when ArrowDown + Enter activates', async () => {
    const user = userEvent.setup()
    renderPalette(sampleItems)
    await openPalette(user)
    await user.keyboard('boris')
    expect(await findResultByName('Boris Petrov')).toBeTruthy()
    // First result is already active (index 0). Press Enter.
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('/npcs/npc-1')
    // Palette should have closed.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cycles through results with ArrowDown then activates the highlighted one', async () => {
    const user = userEvent.setup()
    // Use names that produce a stable ordering. Identical lengths and
    // identical match positions tie on score; secondary sort is name asc.
    const items: SearchIndexItem[] = [
      { id: 'a', type: 'pc', name: 'Convergence A' },
      { id: 'b', type: 'scenario', name: 'Convergence B' },
    ]
    renderPalette(items)
    await openPalette(user)
    await user.keyboard('conv')
    expect(await findResultByName('Convergence A')).toBeTruthy()
    // First result (active by default) is "Convergence A" → /pcs/a.
    // ArrowDown moves to "Convergence B".
    await user.keyboard('{ArrowDown}')
    const second = screen.getAllByRole('option')[1]!
    expect(second).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('/scenarios/b')
  })
})
