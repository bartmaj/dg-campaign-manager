// Select — typed primitive. forwardRef for react-hook-form. No className passthrough — see #033.
import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'style'>

const Select = forwardRef<HTMLSelectElement, Props>(function Select(props, ref) {
  return (
    <select
      ref={ref}
      {...props}
      className="h-9 w-full rounded-sm border border-border bg-surface-2 px-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50"
    />
  )
})

export default Select
