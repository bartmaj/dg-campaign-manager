import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import CharacterForm, {
  type CharacterFormValues,
} from '../../components/CharacterForm/CharacterForm'
import Heading from '../../components/ui/Heading'
import Stack from '../../components/ui/Stack'
import { usePc } from '../../hooks/usePcs'
import { useUpdatePc } from '../../hooks/useUpdatePc'

function EditPcPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: pc, isLoading, error } = usePc(id)
  const updatePc = useUpdatePc()
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!pc) return <p>PC not found.</p>

  const initialValues: Partial<CharacterFormValues> = {
    name: pc.name,
    profession: pc.profession ?? '',
    skills: pc.skills ?? [],
    str: pc.str,
    con: pc.con,
    dex: pc.dex,
    intelligence: pc.intelligence,
    pow: pc.pow,
    cha: pc.cha,
    motivations: (pc.motivations ?? []).join('\n'),
    backstoryHooks: pc.backstoryHooks ?? '',
  }

  async function handleSubmit(values: CharacterFormValues) {
    if (!id) return
    setSubmitError(null)
    const motivations = values.motivations
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean)
    try {
      await updatePc.mutateAsync({
        id,
        patch: {
          name: values.name,
          profession: values.profession.trim() === '' ? null : values.profession,
          str: Number(values.str),
          con: Number(values.con),
          dex: Number(values.dex),
          intelligence: Number(values.intelligence),
          pow: Number(values.pow),
          cha: Number(values.cha),
          skills: values.skills
            .filter((s) => s.name.trim() !== '')
            .map((s) => ({ name: s.name, rating: Number(s.rating) || 0 })),
          motivations,
          backstoryHooks: values.backstoryHooks,
        },
      })
      void navigate(`/pcs/${id}`)
    } catch (err) {
      setSubmitError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Heading level={1}>Edit PC</Heading>
      <CharacterForm
        kind="pc"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={updatePc.isPending}
        submitLabel={updatePc.isPending ? 'Saving…' : 'Save PC'}
      />
      {submitError && <p>{submitError}</p>}
    </Stack>
  )
}

export default EditPcPage
