import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewScenePage from './NewScenePage'
import { scenarioKeys } from '../../hooks/useScenarios'

function renderPage(scenarios: Array<{ id: string; name: string }> = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(
    scenarioKeys.list({}),
    scenarios.map((s) => ({
      id: s.id,
      campaignId: null,
      name: s.name,
      description: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })),
  )
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewScenePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewScenePage', () => {
  it('renders the baseline scene fields', () => {
    renderPage([
      { id: 'scn-1', name: 'Operation Reverberate' },
      { id: 'scn-2', name: 'Music from a Darkened Room' },
    ])
    expect(screen.getByRole('heading', { name: /new scene/i })).toBeInTheDocument()
    const scenarioSelect = screen.getByLabelText('Scenario') as HTMLSelectElement
    expect(scenarioSelect.tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: 'Operation Reverberate' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Music from a Darkened Room' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Order index')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create scene/i })).toBeInTheDocument()
  })
})
