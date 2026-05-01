import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import HomePage from './HomePage'

describe('HomePage', () => {
  it('renders the project heading and an entry per entity', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /delta green campaign manager/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Scenarios' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PCs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sessions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bonds' })).toBeInTheDocument()
  })
})
