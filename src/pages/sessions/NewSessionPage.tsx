import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { sessionInputSchema } from '../../../domain/session'
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
    <section>
      <h1>New Session</h1>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p>
          <label htmlFor="session-name">Name</label>
          <br />
          <input id="session-name" type="text" {...register('name')} />
        </p>
        <p>
          <label htmlFor="session-description">Description</label>
          <br />
          <textarea id="session-description" rows={4} {...register('description')} />
        </p>
        <p>
          <label htmlFor="session-real-world-date">Real-world date</label>
          <br />
          <input id="session-real-world-date" type="date" {...register('realWorldDate')} />
        </p>
        <p>
          <label htmlFor="session-in-game-date">In-game start date</label>
          <br />
          <input id="session-in-game-date" type="date" {...register('inGameDate')} />
        </p>
        <p>
          <label htmlFor="session-in-game-date-end">In-game end date</label>
          <br />
          <input
            id="session-in-game-date-end"
            type="date"
            placeholder="(optional) end of in-game span"
            {...register('inGameDateEnd')}
          />
        </p>
        <p>
          <label htmlFor="session-campaign-id">Campaign ID</label>
          <br />
          <input
            id="session-campaign-id"
            type="text"
            placeholder="(optional) leave blank to use default campaign"
            {...register('campaignId')}
          />
        </p>
        <button type="submit" disabled={createSession.isPending}>
          {createSession.isPending ? 'Creating…' : 'Create Session'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewSessionPage
