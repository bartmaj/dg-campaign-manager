import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewItemPage from './NewItemPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewItemPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewItemPage', () => {
  it('renders the baseline item fields', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /new item/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('History')).toBeInTheDocument()
    expect(screen.getByLabelText('Owner NPC ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Location ID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create item/i })).toBeInTheDocument()
  })
})
