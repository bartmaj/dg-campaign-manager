import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NewPcPage from './NewPcPage'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewPcPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NewPcPage', () => {
  it('renders defaults and recomputes derived HP when stats change', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('heading', { name: /new pc/i })).toBeInTheDocument()

    // Defaults: all stats = 10 → HP = 10
    expect(screen.getByTestId('derived-hp')).toHaveTextContent('10')
    expect(screen.getByTestId('derived-san')).toHaveTextContent('50')

    const nameInput = screen.getByLabelText('Name')
    await user.type(nameInput, 'Test Agent')
    expect(nameInput).toHaveValue('Test Agent')

    // STR 16 + CON 14 = 30 → HP 15
    const strInput = screen.getByLabelText('STR')
    await user.clear(strInput)
    await user.type(strInput, '16')
    const conInput = screen.getByLabelText('CON')
    await user.clear(conInput)
    await user.type(conInput, '14')

    expect(screen.getByTestId('derived-hp')).toHaveTextContent('15')
  })
})
