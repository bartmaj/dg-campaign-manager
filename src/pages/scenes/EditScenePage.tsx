import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useScenarios } from '../../hooks/useScenarios'
import { useScene } from '../../hooks/useScenes'
import { useUpdateScene } from '../../hooks/useUpdateScene'

type FormValues = {
  scenarioId: string
  name: string
  description: string
  orderIndex: string
}

function emptyToNull(s: string): string | null {
  return s.trim() === '' ? null : s.trim()
}

function EditScenePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: scene, isLoading, error } = useScene(id)
  const scenariosQuery = useScenarios()
  const scenarios = scenariosQuery.data ?? []
  const updateScene = useUpdateScene()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      scenarioId: '',
      name: '',
      description: '',
      orderIndex: '0',
    },
  })

  useEffect(() => {
    if (scene) {
      reset({
        scenarioId: scene.scenarioId,
        name: scene.name,
        description: scene.description ?? '',
        orderIndex: String(scene.orderIndex ?? 0),
      })
    }
  }, [scene, reset])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!scene) return <p>Scene not found.</p>

  async function onSubmit(values: FormValues) {
    if (!id) return
    setFormError(null)
    const orderIndex = Number.parseInt(values.orderIndex, 10)
    try {
      await updateScene.mutateAsync({
        id,
        patch: {
          scenarioId: values.scenarioId.trim(),
          name: values.name,
          description: emptyToNull(values.description),
          orderIndex: Number.isNaN(orderIndex) ? 0 : orderIndex,
        },
      })
      void navigate(`/scenes/${id}`)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit Scene</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field
            label="Scenario"
            helper={
              scenariosQuery.isLoading
                ? 'Loading scenarios…'
                : scenarios.length === 0
                  ? 'No scenarios yet — create one first.'
                  : undefined
            }
          >
            <Select {...register('scenarioId')} disabled={scenarios.length === 0}>
              <option value="">— Select a scenario —</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
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
            <Button type="submit" variant="primary" disabled={updateScene.isPending}>
              {updateScene.isPending ? 'Saving…' : 'Save Scene'}
            </Button>
            <LinkButton to={`/scenes/${id}`} variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {formError && <p>{formError}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default EditScenePage
