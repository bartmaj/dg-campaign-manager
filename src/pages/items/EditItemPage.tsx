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
import { useItem } from '../../hooks/useItems'
import { useLocations } from '../../hooks/useLocations'
import { useNpcs } from '../../hooks/useNpcs'
import { useUpdateItem } from '../../hooks/useUpdateItem'

type FormValues = {
  name: string
  description: string
  history: string
  ownerNpcId: string
  locationId: string
}

function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading, error } = useItem(id)
  const npcsQuery = useNpcs()
  const npcs = npcsQuery.data ?? []
  const locationsQuery = useLocations()
  const locations = locationsQuery.data ?? []
  const updateItem = useUpdateItem()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      history: '',
      ownerNpcId: '',
      locationId: '',
    },
  })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        description: item.description ?? '',
        history: item.history ?? '',
        ownerNpcId: item.ownerNpcId ?? '',
        locationId: item.locationId ?? '',
      })
    }
  }, [item, reset])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!item) return <p>Item not found.</p>

  async function onSubmit(values: FormValues) {
    if (!id) return
    setFormError(null)
    try {
      await updateItem.mutateAsync({
        id,
        patch: {
          name: values.name,
          description: values.description.trim() === '' ? null : values.description,
          history: values.history.trim() === '' ? null : values.history,
          ownerNpcId: values.ownerNpcId.trim() === '' ? null : values.ownerNpcId.trim(),
          locationId: values.locationId.trim() === '' ? null : values.locationId.trim(),
        },
      })
      void navigate(`/items/${id}`)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit Item</Heading>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Stack gap="md">
          <Field label="Name">
            <Input type="text" {...register('name')} />
          </Field>
          <Field label="Description">
            <Textarea rows={4} {...register('description')} />
          </Field>
          <Field label="History">
            <Textarea rows={3} {...register('history')} />
          </Field>
          <Field
            label="Owner NPC"
            helper={
              npcsQuery.isLoading
                ? 'Loading NPCs…'
                : npcs.length === 0
                  ? 'No NPCs yet — create one first.'
                  : undefined
            }
          >
            <Select {...register('ownerNpcId')}>
              <option value="">— No owner —</option>
              {npcs.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Location"
            helper={
              locationsQuery.isLoading
                ? 'Loading locations…'
                : locations.length === 0
                  ? 'No locations yet — create one first.'
                  : undefined
            }
          >
            <Select {...register('locationId')}>
              <option value="">— No location —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Toolbar align="start">
            <Button type="submit" variant="primary" disabled={updateItem.isPending}>
              {updateItem.isPending ? 'Saving…' : 'Save Item'}
            </Button>
            <LinkButton to={`/items/${id}`} variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {formError && <p>{formError}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default EditItemPage
