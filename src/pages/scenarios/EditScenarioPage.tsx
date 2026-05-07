import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useScenario } from '../../hooks/useScenarios'
import { useUpdateScenario } from '../../hooks/useUpdateScenario'

type FormValues = {
  name: string
  description: string
  campaignId: string
}

function emptyToNull(s: string): string | null {
  return s.trim() === '' ? null : s.trim()
}

function EditScenarioPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: scenario, isLoading, error } = useScenario(id)
  const updateScenario = useUpdateScenario()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: '', description: '', campaignId: '' },
  })

  useEffect(() => {
    if (scenario) {
      reset({
        name: scenario.name,
        description: scenario.description ?? '',
        campaignId: scenario.campaignId ?? '',
      })
    }
  }, [scenario, reset])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!scenario) return <p>Scenario not found.</p>

  async function onSubmit(values: FormValues) {
    if (!id) return
    setFormError(null)
    try {
      await updateScenario.mutateAsync({
        id,
        patch: {
          name: values.name,
          description: emptyToNull(values.description),
          campaignId: emptyToNull(values.campaignId),
        },
      })
      void navigate(`/scenarios/${id}`)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit Scenario</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Field label="Campaign ID" helper="(optional) leave blank to clear">
            <Input type="text" {...register('campaignId')} />
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={updateScenario.isPending}>
              {updateScenario.isPending ? 'Saving…' : 'Save Scenario'}
            </Button>
            <LinkButton to={`/scenarios/${id}`} variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {formError && <p>{formError}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default EditScenarioPage
