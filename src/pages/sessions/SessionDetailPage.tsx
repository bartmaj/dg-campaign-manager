import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ENTITY_TYPES, type EntityType } from '../../../db/schema'
import { EDGE_RULES, kindsForSource } from '../../../domain/edges'
import type { EdgeRow } from '../../api/edges'
import type { SessionReportItem } from '../../api/sessions'
import DeleteEntityButton from '../../components/DeleteEntityButton/DeleteEntityButton'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EditOnly from '../../components/ui/EditOnly'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Inline from '../../components/ui/Inline'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'
import Badge from '../../components/ui/Badge'
import { useCurrentSessionId } from '../../lib/currentSession'
import { useCreateEdge } from '../../hooks/useCreateEdge'
import { useDeleteEdge } from '../../hooks/useDeleteEdge'
import { useDeleteSession } from '../../hooks/useDeleteSession'
import { useIncomingEdges, useOutgoingEdges } from '../../hooks/useEdges'
import { useSession } from '../../hooks/useSessions'
import { useSessionReport } from '../../hooks/useSessionReport'
import { usePatchSession } from '../../hooks/usePatchSession'

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
  const deleteSession = useDeleteSession()

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
        <Inline gap="sm">
          <CurrentSessionControl sessionId={session.id} />
          <LinkButton href={`/api/sessions/${session.id}/export`} variant="ghost" download>
            Download as Markdown
          </LinkButton>
          <LinkButton
            href={`/api/sessions/${session.id}/handout`}
            variant="ghost"
            download
            aria-label="Player-safe handout (delivered clues, encountered NPCs, locations, your handler notes)."
          >
            Download handout
          </LinkButton>
          <EditOnly>
            <LinkButton to={`/sessions/${session.id}/edit`} variant="ghost">
              Edit
            </LinkButton>
          </EditOnly>
          <EditOnly>
            <DeleteEntityButton
              onConfirm={() => deleteSession.mutateAsync(session.id).then(() => undefined)}
              entityLabel="session"
              entityName={session.name}
              redirectTo="/sessions"
            />
          </EditOnly>
        </Inline>
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

      {id && <EventLogCard sessionId={id} />}

      {id && (
        <NotesCard sessionId={id} initialNotes={session.notes ?? null} key={session.updatedAt} />
      )}

      {id && (
        <PlayerNotesCard
          sessionId={id}
          initialPlayerNotes={session.playerNotes ?? null}
          key={`player-${session.updatedAt}`}
        />
      )}

      {id && <EntityRelationships entityType="session" entityId={id} />}
    </Stack>
  )
}

const KIND_LABEL: Record<SessionReportItem['kind'], string> = {
  clue_delivered: 'Clue delivered',
  clue_undelivered: 'Clue un-delivered',
  npc_encountered: 'NPC',
  bond_damage: 'Bond',
  san_change: 'SAN',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function deltaLabel(d: number): string {
  return d < 0 ? `− ${Math.abs(d)}` : `+ ${d}`
}

function EventLogRow({ item }: { item: SessionReportItem }) {
  const time = formatTime(item.appliedAt)
  switch (item.kind) {
    case 'clue_delivered':
    case 'clue_undelivered': {
      const recipients =
        item.pcIds.length === 0
          ? '(no recipients)'
          : item.pcIds.map((pid, i) => (
              <span key={pid}>
                {i > 0 ? ', ' : ''}
                <Link to={`/pcs/${pid}`}>{pid}</Link>
              </span>
            ))
      return (
        <li>
          <Inline gap="sm">
            <Badge>{KIND_LABEL[item.kind]}</Badge>
            <span>{time}</span>
            <span>·</span>
            <Link to={`/clues/${item.clueId}`}>{item.clueName}</Link>
            <span>→</span>
            <span>{recipients}</span>
            {item.note ? <span>(note: {item.note})</span> : null}
          </Inline>
        </li>
      )
    }
    case 'npc_encountered':
      return (
        <li>
          <Inline gap="sm">
            <Badge>{KIND_LABEL[item.kind]}</Badge>
            <span>{time}</span>
            <span>·</span>
            <Link to={`/npcs/${item.npcId}`}>{item.npcName}</Link>
            {item.note ? <span>(note: {item.note})</span> : null}
          </Inline>
        </li>
      )
    case 'bond_damage':
      return (
        <li>
          <Inline gap="sm">
            <Badge>{KIND_LABEL[item.kind]}</Badge>
            <span>{time}</span>
            <span>·</span>
            <span>{item.bondName}</span>
            <span>{deltaLabel(item.delta)}</span>
            {item.reason ? <span>(reason: {item.reason})</span> : null}
          </Inline>
        </li>
      )
    case 'san_change':
      return (
        <li>
          <Inline gap="sm">
            <Badge>{KIND_LABEL[item.kind]}</Badge>
            <span>{time}</span>
            <span>·</span>
            <Link to={`/pcs/${item.pcId}`}>{item.pcName}</Link>
            <span>{deltaLabel(item.delta)}</span>
            <span>(source: {item.source})</span>
          </Inline>
        </li>
      )
  }
}

function EventLogCard({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useSessionReport(sessionId)
  const items = useMemo(() => data?.items ?? [], [data])
  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Event log</Heading>
        {isLoading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>
            No tagged events yet — open Cmd-K (or use the play-mode toolbar) and start logging
            during the session.
          </p>
        ) : (
          <ul>
            {items.map((item, i) => (
              <EventLogRow key={`${item.kind}-${item.appliedAt}-${i}`} item={item} />
            ))}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

function NotesCard({
  sessionId,
  initialNotes,
}: {
  sessionId: string
  initialNotes: string | null
}) {
  // Parent keys this card by `session.updatedAt`, so a server-confirmed
  // mutation remounts the card and re-seeds local state from the prop. No
  // useEffect needed.
  const [value, setValue] = useState<string>(initialNotes ?? '')
  const patch = usePatchSession()
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function onSave() {
    const next = value.trim() === '' ? null : value
    await patch.mutateAsync({ id: sessionId, patch: { notes: next } })
    setSavedAt(new Date().toLocaleTimeString())
  }

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Notes</Heading>
        <EditOnly
          fallback={
            value.trim() === '' ? (
              <p>
                <em>No notes yet.</em>
              </p>
            ) : (
              <Prose>{value}</Prose>
            )
          }
        >
          <Stack gap="sm">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Long-form session recap. Saved separately from the structured event log above."
              aria-label="Session notes"
            />
            <Toolbar align="start">
              <Button
                type="button"
                variant="primary"
                onClick={() => void onSave()}
                disabled={patch.isPending}
              >
                {patch.isPending ? 'Saving…' : 'Save notes'}
              </Button>
              {savedAt && !patch.isPending ? <span>Saved at {savedAt}</span> : null}
            </Toolbar>
          </Stack>
        </EditOnly>
      </Stack>
    </Card>
  )
}

function PlayerNotesCard({
  sessionId,
  initialPlayerNotes,
}: {
  sessionId: string
  initialPlayerNotes: string | null
}) {
  // Same remount-on-update pattern as NotesCard.
  const [value, setValue] = useState<string>(initialPlayerNotes ?? '')
  const patch = usePatchSession()
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function onSave() {
    const next = value.trim() === '' ? null : value
    await patch.mutateAsync({ id: sessionId, patch: { playerNotes: next } })
    setSavedAt(new Date().toLocaleTimeString())
  }

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Player notes</Heading>
        <EditOnly
          fallback={
            value.trim() === '' ? <Prose>No notes for players yet.</Prose> : <Prose>{value}</Prose>
          }
        >
          <Stack gap="sm">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Use this to draft what players will see in the handout."
              aria-label="Player notes"
            />
            <Toolbar align="start">
              <Button
                type="button"
                variant="primary"
                onClick={() => void onSave()}
                disabled={patch.isPending}
              >
                {patch.isPending ? 'Saving…' : 'Save player notes'}
              </Button>
              {savedAt && !patch.isPending ? <span>Saved at {savedAt}</span> : null}
            </Toolbar>
          </Stack>
        </EditOnly>
      </Stack>
    </Card>
  )
}

function CurrentSessionControl({ sessionId }: { sessionId: string }) {
  const { value, set } = useCurrentSessionId()
  const isCurrent = value === sessionId
  if (isCurrent) {
    return (
      <Inline gap="sm">
        <Badge variant="accent">Current session</Badge>
        <Button size="sm" variant="ghost" onClick={() => set(null)}>
          Stop tracking
        </Button>
      </Inline>
    )
  }
  return (
    <Button size="sm" variant="secondary" onClick={() => set(sessionId)}>
      Set as current session
    </Button>
  )
}

export default SessionDetailPage
