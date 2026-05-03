// Prose — paragraph that preserves user-entered whitespace and line breaks.
// Used for description/notes fields where the GM typed multi-line content.
// No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

function Prose({ children }: Props) {
  return <p className="text-sm text-ink whitespace-pre-wrap">{children}</p>
}

export default Prose
