import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { scenarioKeys } from '../../hooks/useScenarios'
import { sceneKeys } from '../../hooks/useScenes'
import ScenarioDetailPage from './ScenarioDetailPage'

const mockScenario = {
  id: 's1',
  campaignId: 'c1',
  name: 'Operation Reverberate',
  description: 'A pre-dawn raid.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(scenarioKeys.detail('s1'), mockScenario)
  qc.setQueryData(scenarioKeys.list(), [mockScenario])
  qc.setQueryData(sceneKeys.list('s1'), [])
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/scenarios/s1']}>
        <Routes>
          <Route path="/scenarios/:id" element={<ScenarioDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ScenarioDetailPage', () => {
  it('renders the scenario name and description', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /operation reverberate/i })).toBeInTheDocument()
    expect(screen.getByText('A pre-dawn raid.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /new scene/i })).toBeInTheDocument()
  })
})
