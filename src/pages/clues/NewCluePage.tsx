import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { clueInputSchema, type ClueInputParsed } from '../../../domain/clue'
import { useCreateClue } from '../../hooks/useCreateClue'

type FormValues = {
  name: string
  description: string
  originScenarioId: string
}

function NewCluePage() {
  const navigate = useNavigate()
  const createClue = useCreateClue()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', description: '', originScenarioId: '' },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const payload: ClueInputParsed = {
      name: values.name,
      description: values.description.trim() === '' ? null : values.description,
      originScenarioId:
        values.originScenarioId.trim() === '' ? null : values.originScenarioId.trim(),
      campaignId: null,
    }
    const validation = clueInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createClue.mutateAsync(validation.data)
      void navigate(`/clues/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>New Clue</h1>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p>
          <label htmlFor="clue-name">Name</label>
          <br />
          <input id="clue-name" type="text" {...register('name')} />
        </p>
        <p>
          <label htmlFor="clue-description">Description</label>
          <br />
          <textarea id="clue-description" rows={4} {...register('description')} />
        </p>
        <p>
          <label htmlFor="clue-origin-scenario">Origin Scenario ID</label>
          <br />
          <input
            id="clue-origin-scenario"
            type="text"
            placeholder="(optional) scenario UUID"
            {...register('originScenarioId')}
          />
        </p>
        <button type="submit" disabled={createClue.isPending}>
          {createClue.isPending ? 'Creating…' : 'Create Clue'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewCluePage
