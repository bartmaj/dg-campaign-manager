// FactionContext — curated three-panel "what's happening" view for a Faction
// (#020): the GM-authored status timeline, member NPCs (FK ∪ edge), and
// implicating clues (incoming clue→faction edges). Mirrors LocationContext.
//
// Composes design-system primitives only — no inline styles or className.
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useIncomingEdges } from '../../hooks/useEdges'
import { useEntityNames } from '../../hooks/useEntityNames'
import {
  useCreateFactionStatus,
  useDeleteFactionStatus,
  useFactionStatus,
} from '../../hooks/useFactionStatus'
import { useNpcs } from '../../hooks/useNpcs'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Field from '../ui/Field'
import Heading from '../ui/Heading'
import IconButton from '../ui/IconButton'
import Inline from '../ui/Inline'
import Input from '../ui/Input'
import Prose from '../ui/Prose'
import Stack from '../ui/Stack'
import Textarea from '../ui/Textarea'

type Props = {
  factionId: string
}

type MemberLinkage = 'fk' | 'member_of'

const MEMBER_LINKAGE_LABEL: Record<MemberLinkage, string> = {
  fk: 'current member',
  member_of: 'linked',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().slice(0, 10)
}

function StatusTimelinePanel({ factionId }: { factionId: string }) {
  const { data: events = [] } = useFactionStatus(factionId)
  const createStatus = useCreateFactionStatus()
  const deleteStatus = useDeleteFactionStatus(factionId)

  const [note, setNote] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [sessionId, setSessionId] = useState('')

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const ao = Date.parse(a.occurredAt) || 0
      const bo = Date.parse(b.occurredAt) || 0
      if (ao !== bo) return ao - bo
      const ac = Date.parse(a.createdAt) || 0
      const bc = Date.parse(b.createdAt) || 0
      return ac - bc
    })
  }, [events])

  const canSubmit = note.trim().length > 0 && occurredAt.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    // Convert YYYY-MM-DD from <input type="date"> to a full ISO timestamp.
    const iso = new Date(`${occurredAt}T00:00:00Z`).toISOString()
    createStatus.mutate(
      {
        factionId,
        note: note.trim(),
        occurredAt: iso,
        sessionId: sessionId.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNote('')
          setOccurredAt('')
          setSessionId('')
        },
      },
    )
  }

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Status timeline</Heading>
        {sorted.length === 0 ? (
          <EmptyState title="No status changes recorded yet." />
        ) : (
          <ul>
            {sorted.map((ev) => (
              <li key={ev.id}>
                <Inline gap="sm">
                  <Badge>{formatDate(ev.occurredAt)}</Badge>
                  <Prose>{ev.note}</Prose>
                  {ev.sessionId ? <Link to={`/sessions/${ev.sessionId}`}>session</Link> : null}
                  <IconButton
                    aria-label={`Remove status note from ${formatDate(ev.occurredAt)}`}
                    onClick={() => deleteStatus.mutate(ev.id)}
                  >
                    ✕
                  </IconButton>
                </Inline>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <Heading level={3}>Add status note</Heading>
            <Field label="Date">
              <Input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </Field>
            <Field label="Note">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened?"
              />
            </Field>
            <Field label="Session id (optional)">
              <Input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="UUID of the session if relevant"
              />
            </Field>
            <Inline>
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || createStatus.isPending}
              >
                Add
              </Button>
            </Inline>
          </Stack>
        </form>
      </Stack>
    </Card>
  )
}

function MembersPanel({ factionId }: { factionId: string }) {
  const { data: fkNpcs = [] } = useNpcs({ factionId })
  const { data: incoming = [] } = useIncomingEdges('faction', factionId)

  const memberEdges = useMemo(
    () => incoming.filter((e) => e.sourceType === 'npc' && e.kind === 'member_of'),
    [incoming],
  )

  type Row = { id: string; name?: string; linkage: MemberLinkage }
  const merged = useMemo<Row[]>(() => {
    const seen = new Map<string, Row>()
    for (const npc of fkNpcs) {
      seen.set(npc.id, { id: npc.id, name: npc.name, linkage: 'fk' })
    }
    for (const e of memberEdges) {
      if (seen.has(e.sourceId)) continue
      seen.set(e.sourceId, { id: e.sourceId, linkage: 'member_of' })
    }
    return [...seen.values()]
  }, [fkNpcs, memberEdges])

  const idsNeedingNames = useMemo(() => merged.filter((r) => !r.name).map((r) => r.id), [merged])
  const namesQuery = useEntityNames('npc', idsNeedingNames)
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of namesQuery.data?.items ?? []) m.set(r.id, r.name)
    return m
  }, [namesQuery.data])

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Members</Heading>
        {merged.length === 0 ? (
          <EmptyState title="No members listed." />
        ) : (
          <ul>
            {merged.map((r) => {
              const name = r.name ?? nameById.get(r.id)
              return (
                <li key={r.id}>
                  <Inline gap="sm">
                    <Link to={`/npcs/${r.id}`}>{name ?? r.id}</Link>
                    <Badge>{MEMBER_LINKAGE_LABEL[r.linkage]}</Badge>
                  </Inline>
                </li>
              )
            })}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

function ImplicatingCluesPanel({ factionId }: { factionId: string }) {
  const { data: incoming = [] } = useIncomingEdges('faction', factionId)
  const clueEdges = useMemo(
    () => incoming.filter((e) => e.sourceType === 'clue' && e.kind === 'implicates'),
    [incoming],
  )
  const ids = useMemo(() => clueEdges.map((e) => e.sourceId), [clueEdges])
  const namesQuery = useEntityNames('clue', ids)
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of namesQuery.data?.items ?? []) m.set(r.id, r.name)
    return m
  }, [namesQuery.data])

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Implicating clues</Heading>
        {clueEdges.length === 0 ? (
          <EmptyState title="No clues implicate this faction." />
        ) : (
          <ul>
            {clueEdges.map((e) => {
              const name = nameById.get(e.sourceId)
              return (
                <li key={e.id}>
                  <Link to={`/clues/${e.sourceId}`}>{name ?? e.sourceId}</Link>
                  {e.notes ? ` — ${e.notes}` : null}
                </li>
              )
            })}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

function FactionContext({ factionId }: Props) {
  return (
    <Stack gap="md">
      <StatusTimelinePanel factionId={factionId} />
      <MembersPanel factionId={factionId} />
      <ImplicatingCluesPanel factionId={factionId} />
    </Stack>
  )
}

export default FactionContext
