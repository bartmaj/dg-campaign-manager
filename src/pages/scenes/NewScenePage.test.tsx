import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewScenePage from './NewScenePage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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
    renderPage()
    expect(screen.getByRole('heading', { name: /new scene/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Scenario ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Order index')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create scene/i })).toBeInTheDocument()
  })
})
