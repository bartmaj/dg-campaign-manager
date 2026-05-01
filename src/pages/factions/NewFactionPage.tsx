import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { factionInputSchema, type FactionInputParsed } from '../../../domain/faction'
import { useCreateFaction } from '../../hooks/useCreateFaction'

type FormValues = {
  name: string
  description: string
  agenda: string
}

function NewFactionPage() {
  const navigate = useNavigate()
  const createFaction = useCreateFaction()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', description: '', agenda: '' },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const payload: FactionInputParsed = {
      name: values.name,
      description: values.description.trim() === '' ? null : values.description,
      agenda: values.agenda.trim() === '' ? null : values.agenda,
      campaignId: null,
    }
    const validation = factionInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createFaction.mutateAsync(validation.data)
      void navigate(`/factions/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>New Faction</h1>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p>
          <label htmlFor="faction-name">Name</label>
          <br />
          <input id="faction-name" type="text" {...register('name')} />
        </p>
        <p>
          <label htmlFor="faction-agenda">Agenda</label>
          <br />
          <textarea id="faction-agenda" rows={3} {...register('agenda')} />
        </p>
        <p>
          <label htmlFor="faction-description">Description</label>
          <br />
          <textarea id="faction-description" rows={4} {...register('description')} />
        </p>
        <button type="submit" disabled={createFaction.isPending}>
          {createFaction.isPending ? 'Creating…' : 'Create Faction'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewFactionPage
