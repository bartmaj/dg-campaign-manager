import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useSession } from '../../hooks/useSessions'
import { useUpdateSession } from '../../hooks/useUpdateSession'

type FormValues = {
  name: string
  description: string
  inGameDate: string
  inGameDateEnd: string
  realWorldDate: string
  notes: string
  playerNotes: string
}

function emptyToNull(s: string): string | null {
  return s.trim() === '' ? null : s.trim()
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function EditSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isLoading, error } = useSession(id)
  const updateSession = useUpdateSession()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      inGameDate: '',
      inGameDateEnd: '',
      realWorldDate: '',
      notes: '',
      playerNotes: '',
    },
  })

  useEffect(() => {
    if (session) {
      reset({
        name: session.name,
        description: session.description ?? '',
        inGameDate: session.inGameDate ?? '',
        inGameDateEnd: session.inGameDateEnd ?? '',
        realWorldDate: toDateInputValue(session.realWorldDate),
        notes: session.notes ?? '',
        playerNotes: session.playerNotes ?? '',
      })
    }
  }, [session, reset])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!session) return <p>Session not found.</p>

  async function onSubmit(values: FormValues) {
    if (!id) return
    setFormError(null)
    try {
      await updateSession.mutateAsync({
        id,
        patch: {
          name: values.name,
          description: emptyToNull(values.description),
          inGameDate: emptyToNull(values.inGameDate),
          inGameDateEnd: emptyToNull(values.inGameDateEnd),
          realWorldDate: emptyToNull(values.realWorldDate),
          notes: emptyToNull(values.notes),
          playerNotes: emptyToNull(values.playerNotes),
        },
      })
      void navigate(`/sessions/${id}`)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit Session</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Field label="Real-world date">
            <Input type="date" {...register('realWorldDate')} />
          </Field>
          <Field label="In-game start date">
            <Input type="date" {...register('inGameDate')} />
          </Field>
          <Field label="In-game end date" helper="(optional) end of in-game span">
            <Input type="date" {...register('inGameDateEnd')} />
          </Field>
          <Field label="Notes">
            <Textarea rows={4} {...register('notes')} />
          </Field>
          <Field label="Player notes">
            <Textarea rows={4} {...register('playerNotes')} />
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={updateSession.isPending}>
              {updateSession.isPending ? 'Saving…' : 'Save Session'}
            </Button>
            <LinkButton to={`/sessions/${id}`} variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {formError && <p>{formError}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default EditSessionPage
