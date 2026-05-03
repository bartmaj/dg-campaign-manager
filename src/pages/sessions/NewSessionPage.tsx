import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { sessionInputSchema } from '../../../domain/session'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateSession } from '../../hooks/useCreateSession'

type FormValues = {
  name: string
  description: string
  inGameDate: string
  inGameDateEnd: string
  realWorldDate: string
  campaignId: string
}

function emptyToNull(s: string): string | null {
  return s.trim() === '' ? null : s.trim()
}

function NewSessionPage() {
  const navigate = useNavigate()
  const createSession = useCreateSession()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      inGameDate: '',
      inGameDateEnd: '',
      realWorldDate: '',
      campaignId: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const payload = {
      name: values.name,
      description: emptyToNull(values.description),
      inGameDate: emptyToNull(values.inGameDate),
      inGameDateEnd: emptyToNull(values.inGameDateEnd),
      realWorldDate: emptyToNull(values.realWorldDate),
      campaignId: emptyToNull(values.campaignId),
    }
    const validation = sessionInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createSession.mutateAsync(validation.data)
      void navigate(`/sessions/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>New Session</Heading>
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
          <Field label="Campaign ID" helper="(optional) leave blank to use default campaign">
            <Input type="text" {...register('campaignId')} />
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={createSession.isPending}>
              {createSession.isPending ? 'Creating…' : 'Create Session'}
            </Button>
            <LinkButton to="/sessions" variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {error && <p>{error}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default NewSessionPage
