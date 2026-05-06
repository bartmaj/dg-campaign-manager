import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppModeProvider } from '../../lib/mode'
import EditOnly from './EditOnly'

function renderWithMode(initialEntries: string[], children: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<AppModeProvider>{children}</AppModeProvider>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EditOnly', () => {
  it('renders children in prep mode', () => {
    renderWithMode(['/'], <EditOnly>edit affordance</EditOnly>)
    expect(screen.getByText('edit affordance')).toBeInTheDocument()
  })

  it('hides children in play mode', () => {
    renderWithMode(['/?mode=play'], <EditOnly>edit affordance</EditOnly>)
    expect(screen.queryByText('edit affordance')).not.toBeInTheDocument()
  })

  it('renders fallback in play mode if provided', () => {
    renderWithMode(
      ['/?mode=play'],
      <EditOnly fallback={<span>read only</span>}>edit affordance</EditOnly>,
    )
    expect(screen.queryByText('edit affordance')).not.toBeInTheDocument()
    expect(screen.getByText('read only')).toBeInTheDocument()
  })
})
