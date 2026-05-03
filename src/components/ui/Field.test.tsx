import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Field from './Field'
import Input from './Input'

describe('Field', () => {
  it('associates the label with the input via id', () => {
    render(
      <Field label="Codename">
        <Input name="codename" />
      </Field>,
    )
    const input = screen.getByLabelText('Codename')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
  })

  it('renders a helper message when provided and no error', () => {
    render(
      <Field label="Codename" helper="Use the agent's call sign">
        <Input name="codename" />
      </Field>,
    )
    expect(screen.getByText("Use the agent's call sign")).toBeInTheDocument()
  })

  it('renders the error in place of the helper when provided', () => {
    render(
      <Field label="Codename" helper="Use the agent's call sign" error="Required">
        <Input name="codename" />
      </Field>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.queryByText("Use the agent's call sign")).not.toBeInTheDocument()
    const input = screen.getByLabelText('Codename')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
