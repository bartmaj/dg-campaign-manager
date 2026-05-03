// Field — composes Label + control + helper + error. No className passthrough — see #033.
import { useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import Label from './Label'

type Props = {
  label: ReactNode
  helper?: ReactNode
  error?: ReactNode
  /** A control element (Input, Textarea, Select) — Field clones it to inject the generated id. */
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>
}

function Field({ label, helper, error, children }: Props) {
  const id = useId()
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const describedBy = [helper ? helperId : null, error ? errorId : null].filter(Boolean).join(' ')

  // Clone the control to inject the id and aria attributes — keeps the API ergonomic.
  const control = {
    ...children,
    props: {
      ...children.props,
      id,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': error ? true : undefined,
    },
  } as ReactElement

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {control}
      {helper && !error && (
        <p id={helperId} className="text-xs text-ink-muted">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default Field
