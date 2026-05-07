import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { itemInputSchema, type ItemInputParsed } from '../../../domain/item'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateItem } from '../../hooks/useCreateItem'
import { useLocations } from '../../hooks/useLocations'
import { useNpcs } from '../../hooks/useNpcs'

type FormValues = {
  name: string
  description: string
  history: string
  ownerNpcId: string
  locationId: string
}

function NewItemPage() {
  const navigate = useNavigate()
  const createItem = useCreateItem()
  const npcsQuery = useNpcs()
  const npcs = npcsQuery.data ?? []
  const locationsQuery = useLocations()
  const locations = locationsQuery.data ?? []
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      history: '',
      ownerNpcId: '',
      locationId: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const payload: ItemInputParsed = {
      name: values.name,
      description: values.description.trim() === '' ? null : values.description,
      history: values.history.trim() === '' ? null : values.history,
      ownerNpcId: values.ownerNpcId.trim() === '' ? null : values.ownerNpcId.trim(),
      locationId: values.locationId.trim() === '' ? null : values.locationId.trim(),
      campaignId: null,
    }
    const validation = itemInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }
    try {
      const created = await createItem.mutateAsync(validation.data)
      void navigate(`/items/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>New Item</Heading>
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
            <Button type="submit" variant="primary" disabled={createItem.isPending}>
              {createItem.isPending ? 'Creating…' : 'Create Item'}
            </Button>
            <LinkButton to="/items" variant="ghost">
              Cancel
            </LinkButton>
          </Toolbar>
          {error && <p>{error}</p>}
        </Stack>
      </form>
    </Stack>
  )
}

export default NewItemPage
