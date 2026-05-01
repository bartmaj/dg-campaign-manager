import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { deriveAttributes } from '../../../domain/pc'
import { NPC_STATUSES, type NpcStatus } from '../../../domain/npc'
import { SKILL_PACKAGES, applySkillPackage } from '../../../domain/skillPackages'

export type CharacterFormSkill = {
  name: string
  rating: number
}

/** Union of fields needed by either the PC or NPC create flows. */
export type CharacterFormValues = {
  // Common
  name: string
  profession: string
  skills: CharacterFormSkill[]

  // Stats (PC always; NPC when statBlockKind === 'full')
  str: number
  con: number
  dex: number
  intelligence: number
  pow: number
  cha: number

  // PC-only
  motivations: string
  backstoryHooks: string

  // NPC-only
  status: NpcStatus
  statBlockKind: 'simplified' | 'full'
  hp: number
  wp: number
  mannerisms: string
  voice: string
  secrets: string
  currentGoal: string
}

const PC_DEFAULTS: CharacterFormValues = {
  name: '',
  profession: '',
  skills: [],
  str: 10,
  con: 10,
  dex: 10,
  intelligence: 10,
  pow: 10,
  cha: 10,
  motivations: '',
  backstoryHooks: '',
  status: 'alive',
  statBlockKind: 'simplified',
  hp: 8,
  wp: 6,
  mannerisms: '',
  voice: '',
  secrets: '',
  currentGoal: '',
}

const CUSTOM_PROFESSION_VALUE = '__custom__'

export type CharacterFormProps = {
  kind: 'pc' | 'npc'
  initialValues?: Partial<CharacterFormValues>
  onSubmit: (values: CharacterFormValues) => Promise<void> | void
  submitLabel?: string
  isSubmitting?: boolean
}

function CharacterForm({
  kind,
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
}: CharacterFormProps) {
  const defaultValues: CharacterFormValues = { ...PC_DEFAULTS, ...initialValues }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<CharacterFormValues>({ defaultValues })

  const { fields, append, remove } = useFieldArray({ control, name: 'skills' })

  const statBlockKind = useWatch({ control, name: 'statBlockKind' })
  const showFullStats = kind === 'pc' || statBlockKind === 'full'

  const watchedStats = useWatch({
    control,
    name: ['str', 'con', 'dex', 'intelligence', 'pow', 'cha'],
  })
  const [str, con, dex, intelligence, pow, cha] = watchedStats.map((v) => Number(v) || 0) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ]

  const derived = useMemo(() => {
    if (!showFullStats) return null
    try {
      return deriveAttributes({ str, con, dex, intelligence, pow, cha })
    } catch {
      return null
    }
  }, [showFullStats, str, con, dex, intelligence, pow, cha])

  function handleProfessionChange(value: string) {
    if (value === CUSTOM_PROFESSION_VALUE) {
      setValue('profession', '', { shouldDirty: true })
      setValue('skills', [], { shouldDirty: true })
      return
    }
    setValue('profession', value, { shouldDirty: true })
    setValue('skills', applySkillPackage(value), { shouldDirty: true })
  }

  const onValid: SubmitHandler<CharacterFormValues> = async (values) => {
    await onSubmit(values)
  }

  const submitting = isSubmitting ?? formIsSubmitting
  const label = submitLabel ?? (kind === 'pc' ? 'Create PC' : 'Create NPC')

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name', { required: 'name is required' })} />
        {errors.name && <span style={{ color: 'crimson' }}>{errors.name.message}</span>}
      </div>

      <div>
        <label htmlFor="profession">Profession</label>
        <select
          id="profession"
          aria-label="Profession"
          onChange={(e) => handleProfessionChange(e.target.value)}
          defaultValue={
            defaultValues.profession &&
            SKILL_PACKAGES.some((p) => p.profession === defaultValues.profession)
              ? defaultValues.profession
              : CUSTOM_PROFESSION_VALUE
          }
        >
          <option value={CUSTOM_PROFESSION_VALUE}>(Custom — no preset)</option>
          {SKILL_PACKAGES.map((p) => (
            <option key={p.profession} value={p.profession}>
              {p.profession}
            </option>
          ))}
        </select>
        <input
          aria-label="Profession (custom)"
          placeholder="Profession name"
          {...register('profession')}
        />
      </div>

      {kind === 'npc' && (
        <div>
          <label htmlFor="status">Status</label>
          <select id="status" {...register('status')}>
            {NPC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {kind === 'npc' && (
        <fieldset>
          <legend>Stat block</legend>
          <div>
            <label htmlFor="statBlockKind">Type</label>
            <select id="statBlockKind" {...register('statBlockKind')}>
              <option value="simplified">Simplified (HP / WP only)</option>
              <option value="full">Full (DG RAW stats)</option>
            </select>
          </div>

          {statBlockKind === 'simplified' && (
            <div>
              <label htmlFor="hp">HP</label>
              <input
                id="hp"
                type="number"
                min={0}
                max={99}
                {...register('hp', { valueAsNumber: true })}
              />
              <label htmlFor="wp">WP</label>
              <input
                id="wp"
                type="number"
                min={0}
                max={99}
                {...register('wp', { valueAsNumber: true })}
              />
            </div>
          )}
        </fieldset>
      )}

      {showFullStats && (
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
      )}

      {showFullStats && (
        <fieldset>
          <legend>Derived (read-only)</legend>
          <p>
            HP: <output data-testid="derived-hp">{derived?.hp ?? '—'}</output> · WP:{' '}
            <output data-testid="derived-wp">{derived?.wp ?? '—'}</output>
            {kind === 'pc' && (
              <>
                {' '}
                · BP: <output data-testid="derived-bp">{derived?.bp ?? '—'}</output> · SAN max:{' '}
                <output data-testid="derived-san">{derived?.sanMax ?? '—'}</output>
              </>
            )}
          </p>
        </fieldset>
      )}

      <fieldset>
        <legend>Skills</legend>
        {fields.length === 0 && <p>No skills yet. Pick a profession or add one manually.</p>}
        {fields.map((field, index) => (
          <div key={field.id} data-testid={`skill-row-${index}`}>
            <label htmlFor={`skills.${index}.name`}>Skill</label>
            <input
              id={`skills.${index}.name`}
              aria-label={`Skill ${index} name`}
              {...register(`skills.${index}.name` as const)}
            />
            <label htmlFor={`skills.${index}.rating`}>Rating</label>
            <input
              id={`skills.${index}.rating`}
              aria-label={`Skill ${index} rating`}
              type="number"
              min={0}
              max={99}
              {...register(`skills.${index}.rating` as const, { valueAsNumber: true })}
            />
            <button
              type="button"
              aria-label={`Remove skill ${index}`}
              onClick={() => remove(index)}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => append({ name: '', rating: 0 })}>
          + Add skill
        </button>
      </fieldset>

      {kind === 'pc' && (
        <>
          <div>
            <label htmlFor="motivations">Motivations (one per line)</label>
            <textarea id="motivations" rows={3} {...register('motivations')} />
          </div>
          <div>
            <label htmlFor="backstoryHooks">Backstory hooks</label>
            <textarea id="backstoryHooks" rows={3} {...register('backstoryHooks')} />
          </div>
        </>
      )}

      {kind === 'npc' && (
        <>
          <fieldset>
            <legend>RP hooks</legend>
            <div>
              <label htmlFor="mannerisms">Mannerisms</label>
              <textarea id="mannerisms" rows={2} {...register('mannerisms')} />
            </div>
            <div>
              <label htmlFor="voice">Voice</label>
              <input id="voice" {...register('voice')} />
            </div>
            <div>
              <label htmlFor="secrets">Secrets</label>
              <textarea id="secrets" rows={2} {...register('secrets')} />
            </div>
          </fieldset>
          <div>
            <label htmlFor="currentGoal">Current goal</label>
            <input id="currentGoal" {...register('currentGoal')} />
          </div>
        </>
      )}

      {errors.root && <p style={{ color: 'crimson' }}>{errors.root.message}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : label}
      </button>
    </form>
  )
}

export default CharacterForm
