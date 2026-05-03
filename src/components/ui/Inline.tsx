// Inline — horizontal flex layout. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Gap = 'xs' | 'sm' | 'md' | 'lg'

type Props = {
  gap?: Gap
  children: ReactNode
}

const gapClasses: Record<Gap, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

function Inline({ gap = 'sm', children }: Props) {
  return <div className={`flex flex-row items-center ${gapClasses[gap]}`}>{children}</div>
}

export default Inline
