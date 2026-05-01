import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import FilterBar, { type FilterBarField, type FilterValues } from './FilterBar'

const FIELDS: FilterBarField[] = [
  { id: 'q', label: 'Name', type: 'text', placeholder: 'search' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'alive', label: 'alive' },
      { value: 'dead', label: 'dead' },
    ],
  },
]

function Harness({
  initial = {},
  onChange,
}: {
  initial?: FilterValues
  onChange: (v: FilterValues) => void
}) {
  const [values, setValues] = useState<FilterValues>(initial)
  return (
    <FilterBar
      fields={FIELDS}
      values={values}
      onChange={(next) => {
        setValues(next)
        onChange(next)
      }}
    />
  )
}

describe('FilterBar', () => {
  it('fires onChange with updated text values', async () => {
    const user = userEvent.setup()
    const handle = vi.fn()
    render(<Harness onChange={handle} />)
    const input = screen.getByLabelText('Name')
    await user.type(input, 'jo')
    // Last call should reflect cumulative state.
    expect(handle).toHaveBeenLastCalledWith({ q: 'jo' })
  })

  it('drops a key when its text input is cleared', async () => {
    const user = userEvent.setup()
    const handle = vi.fn()
    render(<Harness initial={{ q: 'x' }} onChange={handle} />)
    const input = screen.getByLabelText('Name') as HTMLInputElement
    await user.clear(input)
    expect(handle).toHaveBeenLastCalledWith({})
  })

  it('fires onChange when select option is chosen', async () => {
    const user = userEvent.setup()
    const handle = vi.fn()
    render(<Harness onChange={handle} />)
    await user.selectOptions(screen.getByLabelText('Status'), 'dead')
    expect(handle).toHaveBeenLastCalledWith({ status: 'dead' })
  })
})
