// EmptyState — placeholder for empty lists/results. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="text-xs text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export default EmptyState
