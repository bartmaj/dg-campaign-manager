// Input — typed primitive. forwardRef for react-hook-form. No className passthrough — see #033.
import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'>

const Input = forwardRef<HTMLInputElement, Props>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className="h-9 w-full rounded-sm border border-border bg-surface-2 px-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50"
    />
  )
})

export default Input
