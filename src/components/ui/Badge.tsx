// Badge — typed status pill. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Variant = 'neutral' | 'accent' | 'danger' | 'warn' | 'ok'

type Props = {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-surface text-ink-muted border-border',
  accent: 'bg-surface text-accent border-accent',
  danger: 'bg-surface text-danger border-danger',
  warn: 'bg-surface text-warn border-warn',
  ok: 'bg-surface text-ok border-ok',
}

function Badge({ variant = 'neutral', children }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}

export default Badge
