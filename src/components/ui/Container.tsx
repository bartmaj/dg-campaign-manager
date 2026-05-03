// Container — max-width content wrapper. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

function Container({ children }: Props) {
  return <div className="mx-auto w-full max-w-5xl px-6 py-6">{children}</div>
}

export default Container
