import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { sceneInputSchema } from '../../../domain/scene'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateScene } from '../../hooks/useCreateScene'
import { useScenarios } from '../../hooks/useScenarios'
import { useScenes } from '../../hooks/useScenes'

/**
 * Lowest non-negative integer not present in `taken`. So {0,1,3} → 2,
 * {} → 0, {0,1,2} → 3.
 */
function lowestAvailable(taken: ReadonlyArray<number>): number {
  const set = new Set(taken)
  for (let i = 0; ; i++) if (!set.has(i)) return i
}

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
  const scenariosQuery = useScenarios()
  const scenarios = scenariosQuery.data ?? []
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, control, setValue } = useForm<FormValues>({
    defaultValues: {
      scenarioId: initialScenarioId,
      name: '',
      description: '',
      orderIndex: '0',
    },
  })

  // Watch the selected scenario, fetch its existing scenes, and auto-fill
  // orderIndex with the lowest unused integer. The user can still override.
  const selectedScenarioId = useWatch({ control, name: 'scenarioId' })
  const scenesQuery = useScenes(selectedScenarioId ? { scenarioId: selectedScenarioId } : undefined)
  const [userTouchedOrderIndex, setUserTouchedOrderIndex] = useState(false)
  useEffect(() => {
    if (!selectedScenarioId) return
    if (!scenesQuery.data) return
    if (userTouchedOrderIndex) return
    const taken = scenesQuery.data.map((s) => s.orderIndex ?? 0)
    setValue('orderIndex', String(lowestAvailable(taken)))
  }, [selectedScenarioId, scenesQuery.data, userTouchedOrderIndex, setValue])

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
          <Field
            label="Order index"
            helper="Auto-defaults to the lowest available index for the chosen scenario."
          >
            <Input
              type="number"
              min={0}
              {...register('orderIndex', {
                onChange: () => setUserTouchedOrderIndex(true),
              })}
            />
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
