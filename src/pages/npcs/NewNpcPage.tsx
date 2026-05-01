import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import {
  NPC_STATUSES,
  npcInputSchema,
  type NpcInputParsed,
  type NpcStatus,
} from '../../../domain/npc'
import { useCreateNpc } from '../../hooks/useCreateNpc'

type StatBlockKind = 'simplified' | 'full'

type FormValues = {
  name: string
  profession: string
  status: NpcStatus
  statBlockKind: StatBlockKind
  // Simplified block
  hp: number
  wp: number
  // Full stat block
  str: number
  con: number
  dex: number
  intelligence: number
  pow: number
  cha: number
  // RP hooks
  mannerisms: string
  voice: string
  secrets: string
  // Misc
  currentGoal: string
}

const DEFAULT_VALUES: FormValues = {
  name: '',
  profession: '',
  status: 'alive',
  statBlockKind: 'simplified',
  hp: 8,
  wp: 6,
  str: 10,
  con: 10,
  dex: 10,
  intelligence: 10,
  pow: 10,
  cha: 10,
  mannerisms: '',
  voice: '',
  secrets: '',
  currentGoal: '',
}

function NewNpcPage() {
  const navigate = useNavigate()
  const createNpc = useCreateNpc()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  })

  const statBlockKind = useWatch({ control, name: 'statBlockKind' })

  async function onSubmit(values: FormValues) {
    const statBlock: NpcInputParsed['statBlock'] =
      values.statBlockKind === 'simplified'
        ? {
            kind: 'simplified',
            hp: Number(values.hp),
            wp: Number(values.wp),
          }
        : {
            kind: 'full',
            stats: {
              str: Number(values.str),
              con: Number(values.con),
              dex: Number(values.dex),
              intelligence: Number(values.intelligence),
              pow: Number(values.pow),
              cha: Number(values.cha),
            },
          }

    const payload: NpcInputParsed = {
      name: values.name,
      profession: values.profession.trim() === '' ? null : values.profession,
      campaignId: null,
      factionId: null,
      locationId: null,
      status: values.status,
      statBlock,
      mannerisms: values.mannerisms.trim() === '' ? null : values.mannerisms,
      voice: values.voice.trim() === '' ? null : values.voice,
      secrets: values.secrets.trim() === '' ? null : values.secrets,
      currentGoal: values.currentGoal.trim() === '' ? null : values.currentGoal,
      description: null,
    }

    const validation = npcInputSchema.safeParse(payload)
    if (!validation.success) {
      setError('root', { message: validation.error.issues.map((i) => i.message).join('; ') })
      return
    }

    try {
      const created = await createNpc.mutateAsync(validation.data)
      void navigate(`/npcs/${created.id}`)
    } catch (err) {
      setError('root', { message: (err as Error).message })
    }
  }

  return (
    <section>
      <h1>New NPC</h1>
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

        <fieldset>
          <legend>Stat block</legend>
          <div>
            <label htmlFor="statBlockKind">Type</label>
            <select id="statBlockKind" {...register('statBlockKind')}>
              <option value="simplified">Simplified (HP / WP only)</option>
              <option value="full">Full (DG RAW stats)</option>
            </select>
          </div>

          {statBlockKind === 'simplified' ? (
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
          ) : (
            <div>
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
            </div>
          )}
        </fieldset>

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

        {errors.root && <p style={{ color: 'crimson' }}>{errors.root.message}</p>}

        <button type="submit" disabled={isSubmitting || createNpc.isPending}>
          {createNpc.isPending ? 'Creating…' : 'Create NPC'}
        </button>
      </form>
    </section>
  )
}

export default NewNpcPage
