import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { sceneInputSchema } from '../../../domain/scene'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
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
    <Stack gap="md">
      <Heading level={1}>New Scene</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Scenario ID">
            <Input type="text" {...register('scenarioId')} />
          </Field>
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Field label="Order index">
            <Input type="number" min={0} {...register('orderIndex')} />
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={createScene.isPending}>
              {createScene.isPending ? 'Creating…' : 'Create Scene'}
            </Button>
            <LinkButton to="/scenes" variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {error && <p>{error}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default NewScenePage
