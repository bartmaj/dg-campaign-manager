// LinkButton — Button-styled link. Mirrors Button variants. No className passthrough — see #033.
// Renders an <a> when `href` is provided, otherwise expects `to` and renders a react-router <Link>.
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useLinkPrefetch } from '../../hooks/useLinkPrefetch'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type Common = {
  variant?: Variant
  size?: Size
  children: ReactNode
}

type RouterProps = Common & {
  to: string
  href?: never
  download?: never
}

type AnchorProps = Common & {
  href: string
  to?: never
  download?: boolean | string
}

type Props = RouterProps | AnchorProps

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

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-sm font-medium transition-colors no-underline cursor-pointer'

function LinkButton(props: Props) {
  const { variant = 'secondary', size = 'md', children } = props
  const className = `${base} ${variantClasses[variant]} ${sizeClasses[size]}`
  const prefetchPath = 'to' in props && props.to ? props.to : ''
  const prefetch = useLinkPrefetch(prefetchPath)
  if ('href' in props && props.href !== undefined) {
    return (
      <a href={props.href} download={props.download} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link
      to={props.to}
      className={className}
      onMouseEnter={prefetch.onMouseEnter}
      onFocus={prefetch.onFocus}
    >
      {children}
    </Link>
  )
}

export default LinkButton
