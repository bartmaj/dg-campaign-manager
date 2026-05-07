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
import { useFaction } from '../../hooks/useFactions'
import { useUpdateFaction } from '../../hooks/useUpdateFaction'

type FormValues = {
  name: string
  description: string
  agenda: string
}

function EditFactionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: faction, isLoading, error } = useFaction(id)
  const updateFaction = useUpdateFaction()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: '', description: '', agenda: '' },
  })

  useEffect(() => {
    if (faction) {
      reset({
        name: faction.name,
        description: faction.description ?? '',
        agenda: faction.agenda ?? '',
      })
    }
  }, [faction, reset])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!faction) return <p>Faction not found.</p>

  async function onSubmit(values: FormValues) {
    if (!id) return
    setFormError(null)
    try {
      await updateFaction.mutateAsync({
        id,
        patch: {
          name: values.name,
          description: values.description.trim() === '' ? null : values.description,
          agenda: values.agenda.trim() === '' ? null : values.agenda,
        },
      })
      void navigate(`/factions/${id}`)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit Faction</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Agenda">
            <Textarea rows={3} {...register('agenda')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={updateFaction.isPending}>
              {updateFaction.isPending ? 'Saving…' : 'Save Faction'}
            </Button>
            <LinkButton to={`/factions/${id}`} variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {formError && <p>{formError}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default EditFactionPage
