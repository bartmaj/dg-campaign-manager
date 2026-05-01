import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewFactionPage from './NewFactionPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewFactionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewFactionPage', () => {
  it('renders the baseline faction fields', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /new faction/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Agenda')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create faction/i })).toBeInTheDocument()
  })
})
