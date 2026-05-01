import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewLocationPage from './NewLocationPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewLocationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewLocationPage', () => {
  it('renders the baseline location fields', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /new location/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Parent Location ID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create location/i })).toBeInTheDocument()
  })
})
