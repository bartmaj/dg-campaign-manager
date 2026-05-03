// Label — typed primitive. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  htmlFor?: string
  children: ReactNode
}

function Label({ htmlFor, children }: Props) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium uppercase tracking-wide text-ink-muted"
    >
      {children}
    </label>
  )
}

export default Label
