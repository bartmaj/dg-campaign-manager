import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewNpcPage from './NewNpcPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewNpcPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewNpcPage', () => {
  it('renders default fields with all four status options and a simplified stat block', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('heading', { name: /new npc/i })).toBeInTheDocument()

    // Status select exposes all four canonical values.
    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement
    const optionValues = Array.from(statusSelect.options).map((o) => o.value)
    expect(optionValues).toEqual(['alive', 'dead', 'missing', 'turned'])

    // Default is the simplified stat block — HP/WP visible, full stats hidden.
    expect(screen.getByLabelText('HP')).toBeInTheDocument()
    expect(screen.getByLabelText('WP')).toBeInTheDocument()
    expect(screen.queryByLabelText('STR')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), 'Cultist Goon')
    expect(screen.getByLabelText('Name')).toHaveValue('Cultist Goon')

    // Switch to full stat block — STR field appears, HP/WP fields disappear.
    await user.selectOptions(screen.getByLabelText('Type'), 'full')
    expect(screen.getByLabelText('STR')).toBeInTheDocument()
    expect(screen.queryByLabelText('HP')).not.toBeInTheDocument()
  })
})
