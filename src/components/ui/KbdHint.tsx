// KbdHint — keyboard shortcut hint. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

function KbdHint({ children }: Props) {
  return (
    <kbd className="inline-flex items-center rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
      {children}
    </kbd>
  )
}

export default KbdHint
