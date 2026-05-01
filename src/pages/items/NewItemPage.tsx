import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { itemInputSchema, type ItemInputParsed } from '../../../domain/item'
import { useCreateItem } from '../../hooks/useCreateItem'

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
    <section>
      <h1>New Item</h1>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p>
          <label htmlFor="item-name">Name</label>
          <br />
          <input id="item-name" type="text" {...register('name')} />
        </p>
        <p>
          <label htmlFor="item-description">Description</label>
          <br />
          <textarea id="item-description" rows={4} {...register('description')} />
        </p>
        <p>
          <label htmlFor="item-history">History</label>
          <br />
          <textarea id="item-history" rows={3} {...register('history')} />
        </p>
        <p>
          <label htmlFor="item-owner">Owner NPC ID</label>
          <br />
          <input id="item-owner" type="text" {...register('ownerNpcId')} />
        </p>
        <p>
          <label htmlFor="item-location">Location ID</label>
          <br />
          <input id="item-location" type="text" {...register('locationId')} />
        </p>
        <button type="submit" disabled={createItem.isPending}>
          {createItem.isPending ? 'Creating…' : 'Create Item'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewItemPage
