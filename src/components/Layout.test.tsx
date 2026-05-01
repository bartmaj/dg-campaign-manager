import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { searchIndexQueryKey } from '../hooks/useSearchIndex'
import Layout from './Layout'

describe('Layout', () => {
  it('mounts the Cmd-K palette so the global shortcut is wired', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(searchIndexQueryKey, { items: [] })

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<div>home</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Palette is dormant until the shortcut fires.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('dialog', { name: /global search/i })).toBeInTheDocument()
  })
})
