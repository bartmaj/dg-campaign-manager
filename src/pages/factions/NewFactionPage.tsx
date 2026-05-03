import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { factionInputSchema, type FactionInputParsed } from '../../../domain/faction'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateFaction } from '../../hooks/useCreateFaction'

type FormValues = {
  name: string
  description: string
  agenda: string
}

function NewFactionPage() {
  const navigate = useNavigate()
  const createFaction = useCreateFaction()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', description: '', agenda: '' },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const payload: FactionInputParsed = {
      name: values.name,
      description: values.description.trim() === '' ? null : values.description,
      agenda: values.agenda.trim() === '' ? null : values.agenda,
      campaignId: null,
    }
    const validation = factionInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createFaction.mutateAsync(validation.data)
      void navigate(`/factions/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>New Faction</Heading>
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
            <Button type="submit" variant="primary" disabled={createFaction.isPending}>
              {createFaction.isPending ? 'Creating…' : 'Create Faction'}
            </Button>
            <LinkButton to="/factions" variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {error && <p>{error}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default NewFactionPage
