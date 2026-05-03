// Card — padded surface with hairline border. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

function Card({ children }: Props) {
  // The thin black bar above the body evokes a redacted/stamped document
  // header — used uniformly to give the UI the Delta Green dossier feel.
  return (
    <div className="bg-surface border border-border rounded-md shadow-[0_1px_0_rgba(0,0,0,0.02)] overflow-hidden">
      <div aria-hidden="true" className="h-1 bg-ink" />
      <div className="p-4">{children}</div>
    </div>
  )
}

export default Card
