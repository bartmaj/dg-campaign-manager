// Card — padded surface with hairline border. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

function Card({ children }: Props) {
  return (
    <div className="bg-surface border border-border rounded-md p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {children}
    </div>
  )
}

export default Card
