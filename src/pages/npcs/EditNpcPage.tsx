import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { NpcStatBlock } from '../../../domain/npc'
import CharacterForm, {
  type CharacterFormValues,
} from '../../components/CharacterForm/CharacterForm'
import Heading from '../../components/ui/Heading'
import Stack from '../../components/ui/Stack'
import { useNpc } from '../../hooks/useNpcs'
import { useUpdateNpc } from '../../hooks/useUpdateNpc'

function EditNpcPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: npc, isLoading, error } = useNpc(id)
  const updateNpc = useUpdateNpc()
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!npc) return <p>NPC not found.</p>

  const hasFullStats = npc.str !== null && npc.con !== null && npc.dex !== null
  const initialValues: Partial<CharacterFormValues> = {
    name: npc.name,
    profession: npc.profession ?? '',
    status: npc.status,
    statBlockKind: hasFullStats ? 'full' : 'simplified',
    str: npc.str ?? 10,
    con: npc.con ?? 10,
    dex: npc.dex ?? 10,
    intelligence: npc.intelligence ?? 10,
    pow: npc.pow ?? 10,
    cha: npc.cha ?? 10,
    hp: npc.hp ?? 8,
    wp: npc.wp ?? 6,
    mannerisms: npc.mannerisms ?? '',
    voice: npc.voice ?? '',
    secrets: npc.secrets ?? '',
    currentGoal: npc.currentGoal ?? '',
    factionId: npc.factionId ?? '',
    locationId: npc.locationId ?? '',
    skills: [],
  }

  async function handleSubmit(values: CharacterFormValues) {
    if (!id) return
    setSubmitError(null)
    const statBlock: NpcStatBlock =
      values.statBlockKind === 'simplified'
        ? { kind: 'simplified', hp: Number(values.hp), wp: Number(values.wp) }
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
    try {
      await updateNpc.mutateAsync({
        id,
        patch: {
          name: values.name,
          profession: values.profession.trim() === '' ? null : values.profession,
          status: values.status,
          factionId: values.factionId.trim() === '' ? null : values.factionId.trim(),
          locationId: values.locationId.trim() === '' ? null : values.locationId.trim(),
          statBlock,
          mannerisms: values.mannerisms.trim() === '' ? null : values.mannerisms,
          voice: values.voice.trim() === '' ? null : values.voice,
          secrets: values.secrets.trim() === '' ? null : values.secrets,
          currentGoal: values.currentGoal.trim() === '' ? null : values.currentGoal,
        },
      })
      void navigate(`/npcs/${id}`)
    } catch (err) {
      setSubmitError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit NPC</Heading>
      <CharacterForm
        kind="npc"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={updateNpc.isPending}
        submitLabel={updateNpc.isPending ? 'Saving…' : 'Save NPC'}
      />
      {submitError && <p>{submitError}</p>}
    </Stack>
  )
}

export default EditNpcPage
