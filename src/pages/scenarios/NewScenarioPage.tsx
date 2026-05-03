import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { scenarioInputSchema } from '../../../domain/scenario'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
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
    <Stack gap="md">
      <Heading level={1}>New Scenario</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Field label="Campaign ID" helper="(optional) leave blank to use default campaign">
            <Input type="text" {...register('campaignId')} />
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={createScenario.isPending}>
              {createScenario.isPending ? 'Creating…' : 'Create Scenario'}
            </Button>
            <LinkButton to="/scenarios" variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {error && <p>{error}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default NewScenarioPage
