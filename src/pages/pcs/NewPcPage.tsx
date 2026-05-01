import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { deriveAttributes, pcInputSchema, type PcInputParsed } from '../../../domain/pc'
import { useCreatePc } from '../../hooks/useCreatePc'

type FormValues = {
  name: string
  profession: string
  str: number
  con: number
  dex: number
  intelligence: number
  pow: number
  cha: number
  skillsJson: string
  motivations: string
  backstoryHooks: string
}

const DEFAULT_VALUES: FormValues = {
  name: '',
  profession: '',
  str: 10,
  con: 10,
  dex: 10,
  intelligence: 10,
  pow: 10,
  cha: 10,
  skillsJson: '[]',
  motivations: '',
  backstoryHooks: '',
}

function parseSkills(json: string): Array<{ name: string; rating: number }> {
  if (!json.trim()) return []
  const parsed: unknown = JSON.parse(json)
  if (!Array.isArray(parsed)) {
    throw new Error('skills must be a JSON array')
  }
  return parsed.map((s, i) => {
    if (
      !s ||
      typeof s !== 'object' ||
      typeof (s as { name?: unknown }).name !== 'string' ||
      typeof (s as { rating?: unknown }).rating !== 'number'
    ) {
      throw new Error(`skills[${i}] must be { name: string, rating: number }`)
    }
    return s as { name: string; rating: number }
  })
}

function NewPcPage() {
  const navigate = useNavigate()
  const createPc = useCreatePc()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  })

  const watched = useWatch({
    control,
    name: ['str', 'con', 'dex', 'intelligence', 'pow', 'cha'],
  })
  const [str, con, dex, intelligence, pow, cha] = watched.map((v) => Number(v) || 0) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ]

  const derived = useMemo(() => {
    try {
      return deriveAttributes({ str, con, dex, intelligence, pow, cha })
    } catch {
      return null
    }
  }, [str, con, dex, intelligence, pow, cha])

  async function onSubmit(values: FormValues) {
    let skills: Array<{ name: string; rating: number }>
    try {
      skills = parseSkills(values.skillsJson)
    } catch (err) {
      setError('skillsJson', { message: (err as Error).message })
      return
    }

    const motivations = values.motivations
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean)

    const payload: PcInputParsed = {
      name: values.name,
      profession: values.profession.trim() === '' ? null : values.profession,
      campaignId: null,
      stats: {
        str: Number(values.str),
        con: Number(values.con),
        dex: Number(values.dex),
        intelligence: Number(values.intelligence),
        pow: Number(values.pow),
        cha: Number(values.cha),
      },
      skills,
      motivations,
      backstoryHooks: values.backstoryHooks,
    }

    const validation = pcInputSchema.safeParse(payload)
    if (!validation.success) {
      setError('root', { message: validation.error.issues.map((i) => i.message).join('; ') })
      return
    }

    try {
      const created = await createPc.mutateAsync(validation.data)
      void navigate(`/pcs/${created.id}`)
    } catch (err) {
      setError('root', { message: (err as Error).message })
    }
  }

  return (
    <section>
      <h1>New PC</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" {...register('name', { required: 'name is required' })} />
          {errors.name && <span style={{ color: 'crimson' }}>{errors.name.message}</span>}
        </div>

        <div>
          <label htmlFor="profession">Profession</label>
          <input id="profession" {...register('profession')} />
        </div>

        <fieldset>
          <legend>Statistics (1–18)</legend>
          {(['str', 'con', 'dex', 'intelligence', 'pow', 'cha'] as const).map((key) => (
            <div key={key}>
              <label htmlFor={key}>{key.toUpperCase()}</label>
              <input
                id={key}
                type="number"
                min={1}
                max={18}
                {...register(key, { valueAsNumber: true, min: 1, max: 18 })}
              />
            </div>
          ))}
        </fieldset>

        <fieldset>
          <legend>Derived (read-only)</legend>
          <p>
            HP: <output data-testid="derived-hp">{derived?.hp ?? '—'}</output> · WP:{' '}
            <output data-testid="derived-wp">{derived?.wp ?? '—'}</output> · BP:{' '}
            <output data-testid="derived-bp">{derived?.bp ?? '—'}</output> · SAN max:{' '}
            <output data-testid="derived-san">{derived?.sanMax ?? '—'}</output>
          </p>
        </fieldset>

        <div>
          <label htmlFor="skillsJson">Skills (JSON array of {`{ name, rating }`})</label>
          <textarea id="skillsJson" rows={4} {...register('skillsJson')} />
          {errors.skillsJson && (
            <span style={{ color: 'crimson' }}>{errors.skillsJson.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="motivations">Motivations (one per line)</label>
          <textarea id="motivations" rows={3} {...register('motivations')} />
        </div>

        <div>
          <label htmlFor="backstoryHooks">Backstory hooks</label>
          <textarea id="backstoryHooks" rows={3} {...register('backstoryHooks')} />
        </div>

        {errors.root && <p style={{ color: 'crimson' }}>{errors.root.message}</p>}

        <button type="submit" disabled={isSubmitting || createPc.isPending}>
          {createPc.isPending ? 'Creating…' : 'Create PC'}
        </button>
      </form>
    </section>
  )
}

export default NewPcPage
