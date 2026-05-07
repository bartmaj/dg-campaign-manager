import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { clueInputSchema, type ClueInputParsed } from '../../../domain/clue'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateClue } from '../../hooks/useCreateClue'
import { useScenarios } from '../../hooks/useScenarios'

type FormValues = {
  name: string
  description: string
  originScenarioId: string
}

function NewCluePage() {
  const navigate = useNavigate()
  const createClue = useCreateClue()
  const scenariosQuery = useScenarios()
  const scenarios = scenariosQuery.data ?? []
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
    <Stack gap="md">
      <Heading level={1}>New Clue</Heading>
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
            <Button type="submit" variant="primary" disabled={createClue.isPending}>
              {createClue.isPending ? 'Creating…' : 'Create Clue'}
            </Button>
            <LinkButton to="/clues" variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {error && <p>{error}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default NewCluePage
