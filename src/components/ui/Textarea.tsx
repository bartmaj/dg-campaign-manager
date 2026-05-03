// Textarea — typed primitive. forwardRef for react-hook-form. No className passthrough — see #033.
import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'>

const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(props, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className="min-h-[6rem] w-full rounded-sm border border-border bg-surface-2 px-2.5 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50"
    />
  )
})

export default Textarea
