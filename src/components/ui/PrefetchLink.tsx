// PrefetchLink — react-router <Link> wrapper that prefetches the destination
// route chunk and (where applicable) its detail GET on first hover/focus.
// No className passthrough — see #033.
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useLinkPrefetch } from '../../hooks/useLinkPrefetch'

type Props = {
  to: string
  children: ReactNode
}

function PrefetchLink({ to, children }: Props) {
  const prefetch = useLinkPrefetch(to)
  return (
    <Link to={to} onMouseEnter={prefetch.onMouseEnter} onFocus={prefetch.onFocus}>
      {children}
    </Link>
  )
}

export default PrefetchLink
