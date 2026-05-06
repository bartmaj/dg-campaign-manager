import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ENTITY_TYPES, type EntityType } from '../../../db/schema'
import { EDGE_RULES, kindsForSource } from '../../../domain/edges'
import type { EdgeRow } from '../../api/edges'
import DeleteEntityButton from '../../components/DeleteEntityButton/DeleteEntityButton'
import EntityRecentActivity from '../../components/EntityRecentActivity/EntityRecentActivity'
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
import Toolbar from '../../components/ui/Toolbar'
import { useClue } from '../../hooks/useClues'
import { useClueDelivery, useCreateClueDeliveryEvent } from '../../hooks/useClueDelivery'
import { useCreateEdge } from '../../hooks/useCreateEdge'
import { useDeleteClue } from '../../hooks/useDeleteClue'
import { useDeleteEdge } from '../../hooks/useDeleteEdge'
import { useOutgoingEdges } from '../../hooks/useEdges'
import { useEntityNames } from '../../hooks/useEntityNames'
import { useSessions } from '../../hooks/useSessions'
import { usePcs } from '../../hooks/usePcs'

// Target types for which at least one rule has source='clue'.
const CLUE_TARGET_TYPES: readonly EntityType[] = ENTITY_TYPES.filter((t) =>
  EDGE_RULES.some((r) => r.source === 'clue' && r.target === t),
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

function ClueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: clue, isLoading, error } = useClue(id)
  const { data: outgoing = [] } = useOutgoingEdges('clue', id)

  const createEdge = useCreateEdge()
  const deleteEdge = useDeleteEdge()
  const deleteClue = useDeleteClue()

  const [targetType, setTargetType] = useState<EntityType>(CLUE_TARGET_TYPES[0] ?? 'npc')
  const [kind, setKind] = useState<string>(
    kindsForSource('clue', CLUE_TARGET_TYPES[0] ?? 'npc')[0] ?? '',
  )
  const [targetId, setTargetId] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const availableKinds = useMemo(() => kindsForSource('clue', targetType), [targetType])

  const grouped = useMemo(() => groupBy(outgoing, (e: EdgeRow) => e.targetType), [outgoing])

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!clue) return <p>Clue not found.</p>

  function onTargetTypeChange(next: EntityType) {
    setTargetType(next)
    const kinds = kindsForSource('clue', next)
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
        sourceType: 'clue',
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
        <Link to="/clues">← All Clues</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{clue.name}</Heading>
        <Inline gap="sm">
          <LinkButton href={`/api/clues/${clue.id}/export`} variant="ghost" download>
            Download as Markdown
          </LinkButton>
          <EditOnly>
            <DeleteEntityButton
              onConfirm={() => deleteClue.mutateAsync(clue.id).then(() => undefined)}
              entityLabel="clue"
              entityName={clue.name}
              redirectTo="/clues"
            />
          </EditOnly>
        </Inline>
      </Toolbar>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Description</Heading>
          <Prose>{clue.description ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Origin Scenario</Heading>
          <p>
            {clue.originScenarioId ? (
              <Link to={`/scenarios/${clue.originScenarioId}`}>{clue.originScenarioId}</Link>
            ) : (
              '—'
            )}
          </p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Linked entities</Heading>
          {outgoing.length === 0 ? (
            <p>—</p>
          ) : (
            CLUE_TARGET_TYPES.map((t) => {
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

      <EditOnly>
        <Card>
          <Stack gap="sm">
            <Heading level={2}>Add edge</Heading>
            <form onSubmit={(e) => void onAddEdge(e)}>
              <Stack gap="sm">
                <Field label="Target type">
                  <Select
                    value={targetType}
                    onChange={(e) => onTargetTypeChange(e.target.value as EntityType)}
                  >
                    {CLUE_TARGET_TYPES.map((t) => (
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
          </Stack>
        </Card>
      </EditOnly>

      {id && <DeliverySection clueId={id} />}

      {id && <EntityRelationships entityType="clue" entityId={id} />}
      {id && <EntityRecentActivity entityType="clue" entityId={id} />}
    </Stack>
  )
}

function DeliverySection({ clueId }: { clueId: string }) {
  const { data, isLoading } = useClueDelivery(clueId)
  const events = useMemo(() => data?.events ?? [], [data])

  // Resolve session and pc names for display.
  const sessionIds = useMemo(() => [...new Set(events.map((e) => e.sessionId))], [events])
  const pcIdSet = useMemo(() => {
    const s = new Set<string>()
    for (const e of events) for (const p of e.pcIds) s.add(p)
    return [...s]
  }, [events])
  const sessionNamesQ = useEntityNames('session', sessionIds)
  const pcNamesQ = useEntityNames('pc', pcIdSet)
  const sessionNameMap = useMemo(
    () => new Map((sessionNamesQ.data?.items ?? []).map((r) => [r.id, r.name])),
    [sessionNamesQ.data],
  )
  const pcNameMap = useMemo(
    () => new Map((pcNamesQ.data?.items ?? []).map((r) => [r.id, r.name])),
    [pcNamesQ.data],
  )
  const sessionName = (id: string) => sessionNameMap.get(id) ?? id
  const pcName = (id: string) => pcNameMap.get(id) ?? id

  return (
    <>
      <Card>
        <Stack gap="sm">
          <Heading level={2}>Delivery</Heading>
          {isLoading ? (
            <p>Loading…</p>
          ) : events.length === 0 ? (
            <p>
              <em>No delivery events recorded yet.</em>
            </p>
          ) : (
            <Stack gap="xs">
              {events.map((e) => (
                <Card key={e.id}>
                  <Stack gap="xs">
                    <Inline gap="sm">
                      <strong>{e.kind}</strong>
                      <span>
                        in <Link to={`/sessions/${e.sessionId}`}>{sessionName(e.sessionId)}</Link>
                      </span>
                      <span>{new Date(e.appliedAt).toISOString().slice(0, 10)}</span>
                    </Inline>
                    {e.pcIds.length > 0 && (
                      <p>
                        Recipients:{' '}
                        {e.pcIds.map((pid, i) => (
                          <span key={pid}>
                            {i > 0 ? ', ' : ''}
                            <Link to={`/pcs/${pid}`}>{pcName(pid)}</Link>
                          </span>
                        ))}
                      </p>
                    )}
                    {e.note && <Prose>{e.note}</Prose>}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      <EditOnly>
        <DeliveryForm clueId={clueId} />
      </EditOnly>
    </>
  )
}

function DeliveryForm({ clueId }: { clueId: string }) {
  const sessionsQ = useSessions('realWorld')
  const pcsQ = usePcs()
  const createDelivery = useCreateClueDeliveryEvent(clueId)
  const [kind, setKind] = useState<'delivered' | 'undelivered'>('delivered')
  const [sessionId, setSessionId] = useState('')
  const [pcIds, setPcIds] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function togglePc(pcId: string) {
    setPcIds((prev) => (prev.includes(pcId) ? prev.filter((p) => p !== pcId) : [...prev, pcId]))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!sessionId) {
      setError('Pick a session.')
      return
    }
    if (kind === 'delivered' && pcIds.length === 0) {
      setError('Delivered events need at least one recipient PC.')
      return
    }
    try {
      await createDelivery.mutateAsync({
        sessionId,
        kind,
        pcIds: kind === 'undelivered' ? [] : pcIds,
        note: note.trim() === '' ? null : note.trim(),
      })
      setPcIds([])
      setNote('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Record delivery event</Heading>
        <form onSubmit={(e) => void onSubmit(e)}>
          <Stack gap="sm">
            <Field label="Kind">
              <Select
                value={kind}
                onChange={(e) => setKind(e.target.value as 'delivered' | 'undelivered')}
              >
                <option value="delivered">Mark delivered</option>
                <option value="undelivered">Mark undelivered (corrective)</option>
              </Select>
            </Field>
            <Field label="Session">
              <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                <option value="">— pick a session —</option>
                {(sessionsQ.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            {kind === 'delivered' && (
              <Field label="Recipient PCs">
                <Stack gap="xs">
                  {(pcsQ.data ?? []).map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={pcIds.includes(p.id)}
                        onChange={() => togglePc(p.id)}
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                </Stack>
              </Field>
            )}
            <Field label="Note (optional)">
              <Input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {error && <p>{error}</p>}
            <Toolbar align="start">
              <Button type="submit" variant="primary" disabled={createDelivery.isPending}>
                {createDelivery.isPending ? 'Saving…' : 'Record event'}
              </Button>
            </Toolbar>
          </Stack>
        </form>
      </Stack>
    </Card>
  )
}

export default ClueDetailPage
