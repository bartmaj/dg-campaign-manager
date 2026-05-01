import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { locationInputSchema, type LocationInputParsed } from '../../../domain/location'
import { useCreateLocation } from '../../hooks/useCreateLocation'

type FormValues = {
  name: string
  description: string
  parentLocationId: string
}

function NewLocationPage() {
  const navigate = useNavigate()
  const createLocation = useCreateLocation()
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
    <section>
      <h1>New Location</h1>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p>
          <label htmlFor="location-name">Name</label>
          <br />
          <input id="location-name" type="text" {...register('name')} />
        </p>
        <p>
          <label htmlFor="location-description">Description</label>
          <br />
          <textarea id="location-description" rows={4} {...register('description')} />
        </p>
        <p>
          <label htmlFor="location-parent">Parent Location ID</label>
          <br />
          <input id="location-parent" type="text" {...register('parentLocationId')} />
        </p>
        <button type="submit" disabled={createLocation.isPending}>
          {createLocation.isPending ? 'Creating…' : 'Create Location'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewLocationPage
