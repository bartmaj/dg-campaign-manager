import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { ClueRow } from '../../api/clues'
import { clueKeys } from '../../hooks/useClues'
import { scenarioKeys } from '../../hooks/useScenarios'
import ClueListPage from './ClueListPage'

function makeClue(overrides: Partial<ClueRow> = {}): ClueRow {
  return {
    id: 'clue-x',
    campaignId: 'c1',
    name: 'Default Clue',
    description: null,
    originScenarioId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const SCENARIO_A = {
  id: 'scenario-a',
  campaignId: 'c1',
  name: 'Night at the Opera',
  description: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}
const SCENARIO_B = {
  id: 'scenario-b',
  campaignId: 'c1',
  name: 'Dust Bowl',
  description: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const CLUE_A = makeClue({ id: 'c1', name: 'Bloody letter', originScenarioId: 'scenario-a' })
const CLUE_B = makeClue({ id: 'c2', name: 'Crumpled map', originScenarioId: 'scenario-b' })

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(clueKeys.list({}), [CLUE_A, CLUE_B])
  qc.setQueryData(clueKeys.list({ originScenarioId: 'scenario-a' }), [CLUE_A])
  qc.setQueryData(scenarioKeys.list(), [SCENARIO_A, SCENARIO_B])
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ClueListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function listedNames(): string[] {
  return screen
    .getAllByRole('link')
    .filter((a) => /^\/clues\/c\d+$/.test(a.getAttribute('href') ?? ''))
    .map((a) => a.textContent ?? '')
}

describe('ClueListPage', () => {
  it('shows all clues by default', () => {
    renderPage()
    expect(listedNames()).toEqual(['Bloody letter', 'Crumpled map'])
  })

  it('filters clues by originScenarioId', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.selectOptions(screen.getByLabelText('Origin scenario'), 'scenario-a')
    expect(listedNames()).toEqual(['Bloody letter'])
  })
})
