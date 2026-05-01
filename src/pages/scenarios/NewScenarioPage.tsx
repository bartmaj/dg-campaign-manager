import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { scenarioInputSchema } from '../../../domain/scenario'
import { useCreateScenario } from '../../hooks/useCreateScenario'

type FormValues = {
  name: string
  description: string
  campaignId: string
}

function emptyToNull(s: string): string | null {
  return s.trim() === '' ? null : s.trim()
}

function NewScenarioPage() {
  const navigate = useNavigate()
  const createScenario = useCreateScenario()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', description: '', campaignId: '' },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const payload = {
      name: values.name,
      description: emptyToNull(values.description),
      campaignId: emptyToNull(values.campaignId),
    }
    const validation = scenarioInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createScenario.mutateAsync(validation.data)
      void navigate(`/scenarios/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>New Scenario</h1>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p>
          <label htmlFor="scenario-name">Name</label>
          <br />
          <input id="scenario-name" type="text" {...register('name')} />
        </p>
        <p>
          <label htmlFor="scenario-description">Description</label>
          <br />
          <textarea id="scenario-description" rows={4} {...register('description')} />
        </p>
        <p>
          <label htmlFor="scenario-campaign-id">Campaign ID</label>
          <br />
          <input
            id="scenario-campaign-id"
            type="text"
            placeholder="(optional) leave blank to use default campaign"
            {...register('campaignId')}
          />
        </p>
        <button type="submit" disabled={createScenario.isPending}>
          {createScenario.isPending ? 'Creating…' : 'Create Scenario'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewScenarioPage
