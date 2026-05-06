import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ShortcutsOverlay } from './ShortcutsOverlay'

function pressQuestionMark() {
  // react-hotkeys-hook reads `event.code` (not just `event.key`); on
  // `?` the lib normalizes via `Slash` + shift modifier.
  fireEvent.keyDown(document.body, { key: '?', code: 'Slash', shiftKey: true })
}

describe('ShortcutsOverlay', () => {
  it('opens via "?" and lists the play-mode shortcuts', async () => {
    render(<ShortcutsOverlay />)

    expect(screen.queryByRole('dialog', { name: /keyboard shortcuts/i })).not.toBeInTheDocument()

    pressQuestionMark()
    const dialog = await screen.findByRole('dialog', { name: /keyboard shortcuts/i })
    expect(dialog).toBeInTheDocument()

    // The five primary play-mode shortcuts are documented.
    expect(dialog).toHaveTextContent(/Cmd-K palette/i)
    expect(dialog).toHaveTextContent(/Mark clue delivered/i)
    expect(dialog).toHaveTextContent(/Log SAN change/i)
    expect(dialog).toHaveTextContent(/Log Bond damage/i)
    expect(dialog).toHaveTextContent(/Jump to current session/i)
  })

  it('closes on Esc', async () => {
    const user = userEvent.setup()
    render(<ShortcutsOverlay />)

    pressQuestionMark()
    expect(await screen.findByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /keyboard shortcuts/i })).not.toBeInTheDocument()
  })

  it('opens when the header IconButton is clicked', async () => {
    const user = userEvent.setup()
    render(<ShortcutsOverlay />)
    await user.click(screen.getByRole('button', { name: /show keyboard shortcuts/i }))
    expect(await screen.findByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument()
  })
})
