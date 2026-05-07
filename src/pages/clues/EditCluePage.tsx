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
import { useClue } from '../../hooks/useClues'
import { useScenarios } from '../../hooks/useScenarios'
import { useUpdateClue } from '../../hooks/useUpdateClue'

type FormValues = {
  name: string
  description: string
  originScenarioId: string
}

function EditCluePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: clue, isLoading, error } = useClue(id)
  const scenariosQuery = useScenarios()
  const scenarios = scenariosQuery.data ?? []
  const updateClue = useUpdateClue()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: '', description: '', originScenarioId: '' },
  })

  useEffect(() => {
    if (clue) {
      reset({
        name: clue.name,
        description: clue.description ?? '',
        originScenarioId: clue.originScenarioId ?? '',
      })
    }
  }, [clue, reset])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!clue) return <p>Clue not found.</p>

  async function onSubmit(values: FormValues) {
    if (!id) return
    setFormError(null)
    try {
      await updateClue.mutateAsync({
        id,
        patch: {
          name: values.name,
          description: values.description.trim() === '' ? null : values.description,
          originScenarioId:
            values.originScenarioId.trim() === '' ? null : values.originScenarioId.trim(),
        },
      })
      void navigate(`/clues/${id}`)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit Clue</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Field
            label="Origin Scenario"
            helper={
              scenariosQuery.isLoading
                ? 'Loading scenarios…'
                : scenarios.length === 0
                  ? 'No scenarios yet — create one first.'
                  : undefined
            }
          >
            <Select {...register('originScenarioId')}>
              <option value="">— No origin scenario —</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={updateClue.isPending}>
              {updateClue.isPending ? 'Saving…' : 'Save Clue'}
            </Button>
            <LinkButton to={`/clues/${id}`} variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {formError && <p>{formError}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default EditCluePage
