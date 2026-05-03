// Heading — typed type-scale primitive. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  level: 1 | 2 | 3
  children: ReactNode
}

const sizeClasses: Record<1 | 2 | 3, string> = {
  1: 'text-2xl font-semibold tracking-tight text-ink',
  2: 'text-lg font-semibold tracking-tight text-ink',
  3: 'text-sm font-semibold uppercase tracking-wide text-ink-muted',
}

function Heading({ level, children }: Props) {
  const className = sizeClasses[level]
  if (level === 1) return <h1 className={className}>{children}</h1>
  if (level === 2) return <h2 className={className}>{children}</h2>
  return <h3 className={className}>{children}</h3>
}

export default Heading
