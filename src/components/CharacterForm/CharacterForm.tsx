import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { deriveAttributes } from '../../../domain/pc'
import { NPC_STATUSES, type NpcStatus } from '../../../domain/npc'
import { SKILL_PACKAGES, applySkillPackage } from '../../../domain/skillPackages'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import Inline from '../ui/Inline'
import Input from '../ui/Input'
import Label from '../ui/Label'
import Select from '../ui/Select'
import Stack from '../ui/Stack'
import Textarea from '../ui/Textarea'
import Toolbar from '../ui/Toolbar'

export type CharacterFormSkill = {
  name: string
  rating: number
}

/** Union of fields needed by either the PC or NPC create flows. */
export type CharacterFormValues = {
  name: string
  profession: string
  skills: CharacterFormSkill[]

  str: number
  con: number
  dex: number
  intelligence: number
  pow: number
  cha: number

  motivations: string
  backstoryHooks: string

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

/**
 * Manual Label+control pairing (rather than Field) so that the dual
 * profession control (preset Select + custom Input) and the named skill
 * rows can each carry their own aria-label without Field cloning a single id.
 */
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
      <Stack gap="md">
        <Stack gap="xs">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name', { required: 'name is required' })} />
          {errors.name && <span>{errors.name.message}</span>}
        </Stack>

        <Stack gap="xs">
          <Label htmlFor="profession">Profession</Label>
          <Select
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
          </Select>
          <Input
            aria-label="Profession (custom)"
            placeholder="Profession name"
            {...register('profession')}
          />
          <p className="text-xs text-ink-muted">
            Selecting a profession pre-fills the skills below.
          </p>
        </Stack>

        {kind === 'npc' && (
          <Stack gap="xs">
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register('status')}>
              {NPC_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Stack>
        )}

        {kind === 'npc' && (
          <fieldset>
            <legend>Stat block</legend>
            <Stack gap="xs">
              <Label htmlFor="statBlockKind">Type</Label>
              <Select id="statBlockKind" {...register('statBlockKind')}>
                <option value="simplified">Simplified (HP / WP only)</option>
                <option value="full">Full (DG RAW stats)</option>
              </Select>

              {statBlockKind === 'simplified' && (
                <Inline gap="md">
                  <Stack gap="xs">
                    <Label htmlFor="hp">HP</Label>
                    <Input
                      id="hp"
                      type="number"
                      min={0}
                      max={99}
                      {...register('hp', { valueAsNumber: true })}
                    />
                  </Stack>
                  <Stack gap="xs">
                    <Label htmlFor="wp">WP</Label>
                    <Input
                      id="wp"
                      type="number"
                      min={0}
                      max={99}
                      {...register('wp', { valueAsNumber: true })}
                    />
                  </Stack>
                </Inline>
              )}
            </Stack>
          </fieldset>
        )}

        {showFullStats && (
          <fieldset>
            <legend>Statistics (1–18)</legend>
            <Inline gap="md">
              {(['str', 'con', 'dex', 'intelligence', 'pow', 'cha'] as const).map((key) => (
                <Stack key={key} gap="xs">
                  <Label htmlFor={key}>{key.toUpperCase()}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={1}
                    max={18}
                    {...register(key, { valueAsNumber: true, min: 1, max: 18 })}
                  />
                </Stack>
              ))}
            </Inline>
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
          <Stack gap="xs">
            {fields.length === 0 && <p>No skills yet. Pick a profession or add one manually.</p>}
            {fields.map((field, index) => (
              <div key={field.id} data-testid={`skill-row-${index}`}>
                <Inline gap="sm">
                  <Stack gap="xs">
                    <Label htmlFor={`skills.${index}.name`}>Skill</Label>
                    <Input
                      id={`skills.${index}.name`}
                      aria-label={`Skill ${index} name`}
                      {...register(`skills.${index}.name` as const)}
                    />
                  </Stack>
                  <Stack gap="xs">
                    <Label htmlFor={`skills.${index}.rating`}>Rating</Label>
                    <Input
                      id={`skills.${index}.rating`}
                      aria-label={`Skill ${index} rating`}
                      type="number"
                      min={0}
                      max={99}
                      {...register(`skills.${index}.rating` as const, { valueAsNumber: true })}
                    />
                  </Stack>
                  <IconButton aria-label={`Remove skill ${index}`} onClick={() => remove(index)}>
                    ✕
                  </IconButton>
                </Inline>
              </div>
            ))}
            <Toolbar align="start">
              <Button type="button" onClick={() => append({ name: '', rating: 0 })}>
                + Add skill
              </Button>
            </Toolbar>
          </Stack>
        </fieldset>

        {kind === 'pc' && (
          <>
            <Stack gap="xs">
              <Label htmlFor="motivations">Motivations (one per line)</Label>
              <Textarea id="motivations" rows={3} {...register('motivations')} />
            </Stack>
            <Stack gap="xs">
              <Label htmlFor="backstoryHooks">Backstory hooks</Label>
              <Textarea id="backstoryHooks" rows={3} {...register('backstoryHooks')} />
            </Stack>
          </>
        )}

        {kind === 'npc' && (
          <>
            <fieldset>
              <legend>RP hooks</legend>
              <Stack gap="md">
                <Stack gap="xs">
                  <Label htmlFor="mannerisms">Mannerisms</Label>
                  <Textarea id="mannerisms" rows={2} {...register('mannerisms')} />
                </Stack>
                <Stack gap="xs">
                  <Label htmlFor="voice">Voice</Label>
                  <Input id="voice" {...register('voice')} />
                </Stack>
                <Stack gap="xs">
                  <Label htmlFor="secrets">Secrets</Label>
                  <Textarea id="secrets" rows={2} {...register('secrets')} />
                </Stack>
              </Stack>
            </fieldset>
            <Stack gap="xs">
              <Label htmlFor="currentGoal">Current goal</Label>
              <Input id="currentGoal" {...register('currentGoal')} />
            </Stack>
          </>
        )}

        {errors.root && <p>{errors.root.message}</p>}

        <Toolbar align="start">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving…' : label}
          </Button>
        </Toolbar>
      </Stack>
    </form>
  )
}

export default CharacterForm
