import { useState } from 'react'
import { useNavigate } from 'react-router'
import { pcInputSchema, type PcInputParsed } from '../../../domain/pc'
import CharacterForm, {
  type CharacterFormValues,
} from '../../components/CharacterForm/CharacterForm'
import { useCreatePc } from '../../hooks/useCreatePc'

function NewPcPage() {
  const navigate = useNavigate()
  const createPc = useCreatePc()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: CharacterFormValues) {
    setError(null)

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
      skills: values.skills
        .filter((s) => s.name.trim() !== '')
        .map((s) => ({ name: s.name, rating: Number(s.rating) || 0 })),
      motivations,
      backstoryHooks: values.backstoryHooks,
    }

    const validation = pcInputSchema.safeParse(payload)
    if (!validation.success) {
      setError(validation.error.issues.map((i) => i.message).join('; '))
      return
    }

    try {
      const created = await createPc.mutateAsync(validation.data)
      void navigate(`/pcs/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>New PC</h1>
      <CharacterForm
        kind="pc"
        onSubmit={handleSubmit}
        isSubmitting={createPc.isPending}
        submitLabel={createPc.isPending ? 'Creating…' : 'Create PC'}
      />
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  )
}

export default NewPcPage
