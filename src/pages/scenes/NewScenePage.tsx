import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { sceneInputSchema } from '../../../domain/scene'
import { useCreateScene } from '../../hooks/useCreateScene'

type FormValues = {
  scenarioId: string
  name: string
  description: string
  orderIndex: string
}

function emptyToNull(s: string): string | null {
  return s.trim() === '' ? null : s.trim()
}

function NewScenePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialScenarioId = searchParams.get('scenarioId') ?? ''
  const createScene = useCreateScene()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      scenarioId: initialScenarioId,
      name: '',
      description: '',
      orderIndex: '0',
    },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const orderIndex = Number.parseInt(values.orderIndex, 10)
    const payload = {
      scenarioId: values.scenarioId.trim(),
      name: values.name,
      description: emptyToNull(values.description),
      orderIndex: Number.isNaN(orderIndex) ? 0 : orderIndex,
    }
    const validation = sceneInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createScene.mutateAsync(validation.data)
      void navigate(`/scenes/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>New Scene</h1>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p>
          <label htmlFor="scene-scenario-id">Scenario ID</label>
          <br />
          <input id="scene-scenario-id" type="text" {...register('scenarioId')} />
        </p>
        <p>
          <label htmlFor="scene-name">Name</label>
          <br />
          <input id="scene-name" type="text" {...register('name')} />
        </p>
        <p>
          <label htmlFor="scene-description">Description</label>
          <br />
          <textarea id="scene-description" rows={4} {...register('description')} />
        </p>
        <p>
          <label htmlFor="scene-order-index">Order index</label>
          <br />
          <input id="scene-order-index" type="number" min={0} {...register('orderIndex')} />
        </p>
        <button type="submit" disabled={createScene.isPending}>
          {createScene.isPending ? 'Creating…' : 'Create Scene'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewScenePage
