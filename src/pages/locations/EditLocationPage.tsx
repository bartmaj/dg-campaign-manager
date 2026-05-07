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
import { useLocation, useLocations } from '../../hooks/useLocations'
import { useUpdateLocation } from '../../hooks/useUpdateLocation'

type FormValues = {
  name: string
  description: string
  parentLocationId: string
}

function EditLocationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: location, isLoading, error } = useLocation(id)
  const locationsQuery = useLocations()
  // Self-exclude: a location cannot be its own parent.
  const locations = (locationsQuery.data ?? []).filter((l) => l.id !== id)
  const updateLocation = useUpdateLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: '', description: '', parentLocationId: '' },
  })

  useEffect(() => {
    if (location) {
      reset({
        name: location.name,
        description: location.description ?? '',
        parentLocationId: location.parentLocationId ?? '',
      })
    }
  }, [location, reset])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!location) return <p>Location not found.</p>

  async function onSubmit(values: FormValues) {
    if (!id) return
    setFormError(null)
    try {
      await updateLocation.mutateAsync({
        id,
        patch: {
          name: values.name,
          description: values.description.trim() === '' ? null : values.description,
          parentLocationId:
            values.parentLocationId.trim() === '' ? null : values.parentLocationId.trim(),
        },
      })
      void navigate(`/locations/${id}`)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit Location</Heading>
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
                  ? 'No other locations to parent under.'
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
            <Button type="submit" variant="primary" disabled={updateLocation.isPending}>
              {updateLocation.isPending ? 'Saving…' : 'Save Location'}
            </Button>
            <LinkButton to={`/locations/${id}`} variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {formError && <p>{formError}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default EditLocationPage
