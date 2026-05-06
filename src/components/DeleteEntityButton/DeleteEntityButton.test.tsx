import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import DeleteEntityButton from './DeleteEntityButton'

function renderButton(props?: Partial<React.ComponentProps<typeof DeleteEntityButton>>) {
  const onConfirm = props?.onConfirm ?? vi.fn(() => Promise.resolve())
  return {
    onConfirm,
    ...render(
      <MemoryRouter>
        <DeleteEntityButton
          onConfirm={onConfirm}
          entityLabel="PC"
          entityName="Agent Smith"
          redirectTo="/pcs"
          {...props}
        />
      </MemoryRouter>,
    ),
  }
}

describe('DeleteEntityButton', () => {
  it('renders the Delete trigger by default', () => {
    renderButton()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm delete/i })).not.toBeInTheDocument()
  })

  it('reveals the inline confirm UI when clicked', async () => {
    const user = userEvent.setup()
    renderButton()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByText(/agent smith/i)).toBeInTheDocument()
    expect(screen.getByText(/this is permanent/i)).toBeInTheDocument()
  })

  it('hides the confirm UI when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderButton()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: /confirm delete/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })
})
