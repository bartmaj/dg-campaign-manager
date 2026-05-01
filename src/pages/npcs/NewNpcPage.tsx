import { useState } from 'react'
import { useNavigate } from 'react-router'
import { npcInputSchema, type NpcInputParsed } from '../../../domain/npc'
import CharacterForm, {
  type CharacterFormValues,
} from '../../components/CharacterForm/CharacterForm'
import { useCreateNpc } from '../../hooks/useCreateNpc'

function NewNpcPage() {
  const navigate = useNavigate()
  const createNpc = useCreateNpc()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: CharacterFormValues) {
    setError(null)

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
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }

    try {
      const created = await createNpc.mutateAsync(validation.data)
      void navigate(`/npcs/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>New NPC</h1>
      <CharacterForm
        kind="npc"
        onSubmit={handleSubmit}
        isSubmitting={createNpc.isPending}
        submitLabel={createNpc.isPending ? 'Creating…' : 'Create NPC'}
      />
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewNpcPage
