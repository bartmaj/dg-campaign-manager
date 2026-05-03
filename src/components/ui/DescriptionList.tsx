// DescriptionList — typed dl/dt/dd wrapper. No className passthrough — see #033.
import type { ReactNode } from 'react'

type Item = {
  term: ReactNode
  details: ReactNode
}

type Props = {
  items: Array<Item>
}

function DescriptionList({ items }: Props) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
      {items.map((item, i) => (
        <div key={i} className="contents">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted self-baseline">
            {item.term}
          </dt>
          <dd className="text-ink">{item.details}</dd>
        </div>
      ))}
    </dl>
  )
}

export default DescriptionList
