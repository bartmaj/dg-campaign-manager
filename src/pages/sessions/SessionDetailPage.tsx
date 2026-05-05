import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ENTITY_TYPES, type EntityType } from '../../../db/schema'
import { EDGE_RULES, kindsForSource } from '../../../domain/edges'
import type { EdgeRow } from '../../api/edges'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useCreateEdge } from '../../hooks/useCreateEdge'
import { useDeleteEdge } from '../../hooks/useDeleteEdge'
import { useIncomingEdges, useOutgoingEdges } from '../../hooks/useEdges'
import { useSession } from '../../hooks/useSessions'

const SESSION_TARGET_TYPES: readonly EntityType[] = ENTITY_TYPES.filter((t) =>
  EDGE_RULES.some((r) => r.source === 'session' && r.target === t),
)

const TARGET_TYPE_LABELS: Record<EntityType, string> = {
  campaign: 'Campaigns',
  scenario: 'Scenarios',
  scene: 'Scenes',
  npc: 'NPCs',
  pc: 'PCs',
  clue: 'Clues',
  item: 'Items',
  faction: 'Factions',
  location: 'Locations',
  session: 'Sessions',
  bond: 'Bonds',
}

function groupBy<T, K extends string>(items: readonly T[], keyFn: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>
  for (const item of items) {
    const k = keyFn(item)
    if (!out[k]) out[k] = []
    out[k].push(item)
  }
  return out
}

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return '—'
  if (start && end) return `${start} – ${end}`
  return start ?? end ?? '—'
}

function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, isLoading, error } = useSession(id)
  const { data: outgoing = [] } = useOutgoingEdges('session', id)
  const { data: incoming = [] } = useIncomingEdges('session', id)

  const createEdge = useCreateEdge()
  const deleteEdge = useDeleteEdge()

  const initialTarget = SESSION_TARGET_TYPES[0] ?? 'scenario'
  const [targetType, setTargetType] = useState<EntityType>(initialTarget)
  const [kind, setKind] = useState<string>(kindsForSource('session', initialTarget)[0] ?? '')
  const [targetId, setTargetId] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const availableKinds = useMemo(() => kindsForSource('session', targetType), [targetType])
  const grouped = useMemo(() => groupBy(outgoing, (e: EdgeRow) => e.targetType), [outgoing])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!session) return <p>Session not found.</p>

  function onTargetTypeChange(next: EntityType) {
    setTargetType(next)
    const kinds = kindsForSource('session', next)
    setKind(kinds[0] ?? '')
  }

  async function onAddEdge(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!id || !kind || !targetType || targetId.trim() === '') {
      setFormError('Pick target type, kind, and target id.')
      return
    }
    try {
      await createEdge.mutateAsync({
        sourceType: 'session',
        sourceId: id,
        targetType,
        targetId: targetId.trim(),
        kind,
        notes: notes.trim() === '' ? null : notes.trim(),
      })
      setTargetId('')
      setNotes('')
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <p>
        <Link to="/sessions">← All Sessions</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{session.name}</Heading>
        <LinkButton href={`/api/sessions/${session.id}/export`} variant="ghost" download>
          Download as Markdown
        </LinkButton>
      </Toolbar>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Description</Heading>
          <Prose>{session.description ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>In-game date</Heading>
          <p>{formatRange(session.inGameDate, session.inGameDateEnd)}</p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Real-world date</Heading>
          <p>
            {session.realWorldDate
              ? new Date(session.realWorldDate).toISOString().slice(0, 10)
              : '—'}
          </p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Linked entities</Heading>
          {outgoing.length === 0 ? (
            <p>—</p>
          ) : (
            SESSION_TARGET_TYPES.map((t) => {
              const edgesForType = grouped[t] ?? []
              if (edgesForType.length === 0) return null
              return (
                <Stack key={t} gap="xs">
                  <Heading level={3}>Linked {TARGET_TYPE_LABELS[t]}</Heading>
                  <ul>
                    {edgesForType.map((edge) => (
                      <li key={edge.id}>
                        <strong>{edge.kind}</strong>:{' '}
                        <Link to={`/${edge.targetType}s/${edge.targetId}`}>{edge.targetId}</Link>
                        {edge.notes ? ` — ${edge.notes}` : null}{' '}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteEdge.mutateAsync(edge.id)}
                          disabled={deleteEdge.isPending}
                        >
                          ✕ Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Stack>
              )
            })
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Add edge</Heading>
          {SESSION_TARGET_TYPES.length === 0 ? (
            <p>
              <em>No outgoing edge kinds defined for sessions yet.</em>
            </p>
          ) : (
            <form onSubmit={(e) => void onAddEdge(e)}>
              <Stack gap="sm">
                <Field label="Target type">
                  <Select
                    value={targetType}
                    onChange={(e) => onTargetTypeChange(e.target.value as EntityType)}
                  >
                    {SESSION_TARGET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TARGET_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Kind">
                  <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                    {availableKinds.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Target ID">
                  <Input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="UUID"
                  />
                </Field>
                <Field label="Notes (optional)">
                  <Input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
                <Toolbar align="start">
                  <Button type="submit" variant="primary" disabled={createEdge.isPending}>
                    {createEdge.isPending ? 'Adding…' : 'Add edge'}
                  </Button>
                </Toolbar>
                {formError && <p>{formError}</p>}
              </Stack>
            </form>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Incoming references</Heading>
          {incoming.length === 0 ? (
            <p>—</p>
          ) : (
            <ul>
              {incoming.map((edge) => (
                <li key={edge.id}>
                  <strong>{edge.kind}</strong> from{' '}
                  <Link to={`/${edge.sourceType}s/${edge.sourceId}`}>
                    {edge.sourceType}/{edge.sourceId}
                  </Link>
                  {edge.notes ? ` — ${edge.notes}` : null}
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Bonds damaged this session</Heading>
          <p>
            <em>
              TODO (#013 follow-up): surface bond_damage_events filtered by sessionId. The
              bond_damage_events table already carries a loose sessionId; a follow-up issue will
              extend GET /api/bonds/:id and add a session-scoped query.
            </em>
          </p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Sanity changes this session</Heading>
          <p>
            <em>
              TODO (#013 follow-up): surface san_change_events filtered by sessionId (loose ref
              already stored).
            </em>
          </p>
        </Stack>
      </Card>

      {id && <EntityRelationships entityType="session" entityId={id} />}
    </Stack>
  )
}

export default SessionDetailPage
