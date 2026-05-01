import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { getSkillPackage } from '../../../domain/skillPackages'
import CharacterForm from './CharacterForm'

function renderForm(props: Partial<Parameters<typeof CharacterForm>[0]> & { kind: 'pc' | 'npc' }) {
  const onSubmit = vi.fn()
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const utils = render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CharacterForm onSubmit={onSubmit} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...utils, onSubmit }
}

describe('CharacterForm', () => {
  it('renders the PC variant without crashing', () => {
    renderForm({ kind: 'pc' })
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('STR')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivations (one per line)')).toBeInTheDocument()
    // NPC-only fields hidden
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mannerisms')).not.toBeInTheDocument()
  })

  it('renders the NPC variant without crashing', () => {
    renderForm({ kind: 'npc' })
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Mannerisms')).toBeInTheDocument()
    expect(screen.getByLabelText('HP')).toBeInTheDocument()
    // PC-only fields hidden
    expect(screen.queryByLabelText('Motivations (one per line)')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Backstory hooks')).not.toBeInTheDocument()
  })

  it('pre-fills skill ratings when "Federal Agent" is selected', async () => {
    const user = userEvent.setup()
    renderForm({ kind: 'pc' })

    const profSelect = screen.getByLabelText('Profession') as HTMLSelectElement
    await user.selectOptions(profSelect, 'Federal Agent')

    const fed = getSkillPackage('Federal Agent')!
    // Pick a canonical skill (HUMINT 60) and assert it appears.
    const humint = fed.skills.find((s) => s.name === 'HUMINT')!
    expect(humint).toBeDefined()

    // Find the row whose name input is set to "HUMINT"
    const nameInputs = screen.getAllByLabelText(/Skill \d+ name/) as HTMLInputElement[]
    const humintIndex = nameInputs.findIndex((i) => i.value === 'HUMINT')
    expect(humintIndex).toBeGreaterThanOrEqual(0)
    const ratingInput = screen.getByLabelText(`Skill ${humintIndex} rating`) as HTMLInputElement
    expect(Number(ratingInput.value)).toBe(humint.rating)
  })

  it('lets the user edit a single skill rating without resetting the others', async () => {
    const user = userEvent.setup()
    renderForm({ kind: 'pc' })

    await user.selectOptions(screen.getByLabelText('Profession'), 'Federal Agent')

    const nameInputs = screen.getAllByLabelText(/Skill \d+ name/) as HTMLInputElement[]
    const fed = getSkillPackage('Federal Agent')!

    // Edit row 0 to rating 7
    const row0Rating = screen.getByLabelText('Skill 0 rating') as HTMLInputElement
    await user.clear(row0Rating)
    await user.type(row0Rating, '7')
    expect(Number(row0Rating.value)).toBe(7)

    // Other rows should retain their package ratings.
    for (let i = 1; i < nameInputs.length; i++) {
      const input = nameInputs[i]
      if (!input) continue
      const expected = fed.skills.find((s) => s.name === input.value)
      if (!expected) continue
      const rating = screen.getByLabelText(`Skill ${i} rating`) as HTMLInputElement
      expect(Number(rating.value)).toBe(expected.rating)
    }
  })

  it('clears all skills when switching to "(Custom — no preset)"', async () => {
    const user = userEvent.setup()
    renderForm({ kind: 'pc' })

    await user.selectOptions(screen.getByLabelText('Profession'), 'Federal Agent')
    expect(screen.getAllByLabelText(/Skill \d+ name/).length).toBeGreaterThan(0)

    // Selecting the leading custom option clears the list.
    const profSelect = screen.getByLabelText('Profession') as HTMLSelectElement
    const customOption = within(profSelect).getByText(/Custom/i) as HTMLOptionElement
    await user.selectOptions(profSelect, customOption.value)

    expect(screen.queryAllByLabelText(/Skill \d+ name/)).toHaveLength(0)
    expect(screen.getByText(/No skills yet/i)).toBeInTheDocument()
  })
})
