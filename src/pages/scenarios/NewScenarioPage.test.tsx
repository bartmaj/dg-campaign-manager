import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewScenarioPage from './NewScenarioPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewScenarioPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewScenarioPage', () => {
  it('renders the baseline scenario fields', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /new scenario/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaign ID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create scenario/i })).toBeInTheDocument()
  })
})
