import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { locationInputSchema, type LocationInputParsed } from '../../../domain/location'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateLocation } from '../../hooks/useCreateLocation'
import { useLocations } from '../../hooks/useLocations'

type FormValues = {
  name: string
  description: string
  parentLocationId: string
}

function NewLocationPage() {
  const navigate = useNavigate()
  const createLocation = useCreateLocation()
  // No self-exclusion needed: this is the *new* location form, so the
  // current location doesn't exist yet. An edit form would need to filter
  // its own id out of the parent options.
  const locationsQuery = useLocations()
  const locations = locationsQuery.data ?? []
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', description: '', parentLocationId: '' },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const payload: LocationInputParsed = {
      name: values.name,
      description: values.description.trim() === '' ? null : values.description,
      parentLocationId:
        values.parentLocationId.trim() === '' ? null : values.parentLocationId.trim(),
      campaignId: null,
    }
    const validation = locationInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createLocation.mutateAsync(validation.data)
      void navigate(`/locations/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>New Location</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Field
            label="Parent Location"
            helper={
              locationsQuery.isLoading
                ? 'Loading locations…'
                : locations.length === 0
                  ? 'No locations yet — create one first.'
                  : undefined
            }
          >
            <Select {...register('parentLocationId')}>
              <option value="">— No parent —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={createLocation.isPending}>
              {createLocation.isPending ? 'Creating…' : 'Create Location'}
            </Button>
            <LinkButton to="/locations" variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {error && <p>{error}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default NewLocationPage
