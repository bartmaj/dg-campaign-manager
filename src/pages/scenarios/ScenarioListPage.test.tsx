import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { scenarioKeys } from '../../hooks/useScenarios'
import ScenarioListPage from './ScenarioListPage'

function renderPage(rows: unknown[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(scenarioKeys.list(), rows)
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ScenarioListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ScenarioListPage', () => {
  it('renders heading and new-scenario link with empty state', () => {
    renderPage([])
    expect(screen.getByRole('heading', { name: /scenarios/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /new scenario/i })).toBeInTheDocument()
    expect(screen.getByText(/no scenarios yet/i)).toBeInTheDocument()
  })
})
