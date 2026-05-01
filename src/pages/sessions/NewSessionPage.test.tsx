import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewSessionPage from './NewSessionPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewSessionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewSessionPage', () => {
  it('renders the baseline session fields', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /new session/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Real-world date')).toBeInTheDocument()
    expect(screen.getByLabelText('In-game start date')).toBeInTheDocument()
    expect(screen.getByLabelText('In-game end date')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaign ID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument()
  })
})
