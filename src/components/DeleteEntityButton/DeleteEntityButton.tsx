import { useState } from 'react'
import { useNavigate } from 'react-router'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Inline from '../ui/Inline'
import Stack from '../ui/Stack'

type Props = {
  onConfirm: () => Promise<void>
  entityLabel: string
  entityName: string
  redirectTo: string
}

/**
 * Inline confirm/cancel delete affordance for entity detail pages. Renders
 * a small "Delete" button; clicking opens an in-place confirmation Card
 * with a danger Badge, the entity label/name, and confirm/cancel actions.
 *
 * On successful delete, navigates to `redirectTo`. Errors are surfaced
 * inline as a short message inside the confirmation card.
 *
 * Composes existing primitives only; no inline styles or className
 * passthrough (see #033).
 */
function DeleteEntityButton({ onConfirm, entityLabel, entityName, redirectTo }: Props) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    )
  }

  async function onConfirmClick() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      void navigate(redirectTo)
    } catch (err) {
      setError((err as Error).message)
      setPending(false)
    }
  }

  return (
    <Card>
      <Stack gap="sm">
        <Inline gap="sm">
          <Badge variant="danger">Confirm delete</Badge>
        </Inline>
        <p>
          Delete this {entityLabel} &lsquo;{entityName}&rsquo;? This is permanent.
        </p>
        {error && <p>{error}</p>}
        <Inline gap="sm">
          <Button
            variant="danger"
            size="sm"
            onClick={() => void onConfirmClick()}
            disabled={pending}
          >
            {pending ? 'Deleting…' : 'Confirm delete'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
            Cancel
          </Button>
        </Inline>
      </Stack>
    </Card>
  )
}

export default DeleteEntityButton
