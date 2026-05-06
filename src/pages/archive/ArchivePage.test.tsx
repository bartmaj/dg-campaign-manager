import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import ArchivePage from './ArchivePage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ArchivePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ArchivePage', () => {
  it('renders a download link pointing at /api/campaigns/all/archive', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /archive/i })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /download archive/i })
    expect(link).toHaveAttribute('href', '/api/campaigns/all/archive')
    expect(link).toHaveAttribute('download')
  })
})
