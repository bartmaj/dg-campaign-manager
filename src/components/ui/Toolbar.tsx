// Toolbar — horizontal action bar. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Align = 'start' | 'between' | 'end'

type Props = {
  align?: Align
  children: ReactNode
}

const alignClasses: Record<Align, string> = {
  start: 'justify-start',
  between: 'justify-between',
  end: 'justify-end',
}

function Toolbar({ align = 'start', children }: Props) {
  return <div className={`flex flex-row items-center gap-2 ${alignClasses[align]}`}>{children}</div>
}

export default Toolbar
