// IconButton — square Button for icon-only actions. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type Props = {
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  'aria-label': string
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white border border-accent hover:opacity-90',
  secondary: 'bg-surface text-ink border border-border hover:bg-surface-2',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-surface',
  danger: 'bg-danger text-white border border-danger hover:opacity-90',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
}

function IconButton({
  variant = 'ghost',
  size = 'md',
  type = 'button',
  disabled,
  onClick,
  'aria-label': ariaLabel,
  children,
}: Props) {
  const base =
    'inline-flex items-center justify-center rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </button>
  )
}

export default IconButton
