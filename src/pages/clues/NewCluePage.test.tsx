import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewCluePage from './NewCluePage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewCluePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewCluePage', () => {
  it('renders the baseline clue fields', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /new clue/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Origin Scenario ID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create clue/i })).toBeInTheDocument()
  })
})
