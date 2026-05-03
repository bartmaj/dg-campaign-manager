import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('renders with the given label and fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn).toBeInTheDocument()
    await user.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies the danger variant by rendering a button with the proper styling hook', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByRole('button', { name: 'Delete' })
    // We don't snapshot Tailwind classes, but we assert the variant produced a button.
    expect(btn.className).toContain('bg-danger')
  })

  it('disables the button when the disabled prop is set', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Disabled' })
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
})
