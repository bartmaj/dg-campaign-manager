// Button — typed primitive. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type Props = {
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-white border border-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  secondary:
    'bg-surface text-ink border border-border hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  ghost:
    'bg-transparent text-ink border border-transparent hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  danger:
    'bg-danger text-white border border-danger hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3 text-sm',
}

function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  disabled,
  onClick,
  children,
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </button>
  )
}

export default Button
