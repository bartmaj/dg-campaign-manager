import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImportPage from './ImportPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ImportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ImportPage', () => {
  it('renders the upload form and import button', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /import scenario/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/markdown/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
  })

  it('renders validation errors returned by the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [{ line: 4, field: 'Faction', message: 'Unresolved wiki-link [[Ghost]].' }],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    renderPage()
    const textarea = screen.getByLabelText(/markdown/i) as HTMLTextAreaElement
    fireEvent.change(textarea, {
      target: { value: '# Scenario: X\n## NPCs\n### Bob\n- **Faction**: [[Ghost]]\n' },
    })
    fireEvent.click(screen.getByRole('button', { name: /import/i }))

    await waitFor(() => {
      expect(screen.getByText(/Validation errors/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Unresolved wiki-link/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
