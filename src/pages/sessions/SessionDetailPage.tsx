import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ENTITY_TYPES, type EntityType } from '../../../db/schema'
import { EDGE_RULES, kindsForSource } from '../../../domain/edges'
import type { EdgeRow } from '../../api/edges'
import { useCreateEdge } from '../../hooks/useCreateEdge'
import { useDeleteEdge } from '../../hooks/useDeleteEdge'
import { useIncomingEdges, useOutgoingEdges } from '../../hooks/useEdges'
import { useSession } from '../../hooks/useSessions'

// Target types for which at least one rule has source='session' (currently
// just `scenario` via `runs_through`).
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
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
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
    <section>
      <p>
        <Link to="/sessions">← All Sessions</Link>
      </p>
      <h1>{session.name}</h1>

      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{session.description ?? '—'}</p>

      <h2>In-game date</h2>
      <p>{formatRange(session.inGameDate, session.inGameDateEnd)}</p>

      <h2>Real-world date</h2>
      <p>
        {session.realWorldDate ? new Date(session.realWorldDate).toISOString().slice(0, 10) : '—'}
      </p>

      <h2>Linked entities</h2>
      {outgoing.length === 0 ? (
        <p>—</p>
      ) : (
        SESSION_TARGET_TYPES.map((t) => {
          const edgesForType = grouped[t] ?? []
          if (edgesForType.length === 0) return null
          return (
            <div key={t}>
              <h3>Linked {TARGET_TYPE_LABELS[t]}</h3>
              <ul>
                {edgesForType.map((edge) => (
                  <li key={edge.id}>
                    <strong>{edge.kind}</strong>:{' '}
                    <Link to={`/${edge.targetType}s/${edge.targetId}`}>{edge.targetId}</Link>
                    {edge.notes ? ` — ${edge.notes}` : null}{' '}
                    <button
                      type="button"
                      onClick={() => void deleteEdge.mutateAsync(edge.id)}
                      disabled={deleteEdge.isPending}
                    >
                      ✕ Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}

      <h2>Add edge</h2>
      {SESSION_TARGET_TYPES.length === 0 ? (
        <p>
          <em>No outgoing edge kinds defined for sessions yet.</em>
        </p>
      ) : (
        <form onSubmit={(e) => void onAddEdge(e)}>
          <p>
            <label htmlFor="edge-target-type">Target type</label>
            <br />
            <select
              id="edge-target-type"
              value={targetType}
              onChange={(e) => onTargetTypeChange(e.target.value as EntityType)}
            >
              {SESSION_TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TARGET_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </p>
          <p>
            <label htmlFor="edge-kind">Kind</label>
            <br />
            <select id="edge-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
              {availableKinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </p>
          <p>
            <label htmlFor="edge-target-id">Target ID</label>
            <br />
            <input
              id="edge-target-id"
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="UUID"
            />
          </p>
          <p>
            <label htmlFor="edge-notes">Notes (optional)</label>
            <br />
            <input
              id="edge-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </p>
          <button type="submit" disabled={createEdge.isPending}>
            {createEdge.isPending ? 'Adding…' : 'Add edge'}
          </button>
        </form>
      )}
      {formError && <p style={{ color: 'crimson' }}>{formError}</p>}

      <h2>Incoming references</h2>
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

      <h2>Bonds damaged this session</h2>
      <p>
        <em>
          TODO (#013 follow-up): surface bond_damage_events filtered by sessionId. The
          bond_damage_events table already carries a loose sessionId; a follow-up issue will extend
          GET /api/bonds/:id and add a session-scoped query.
        </em>
      </p>

      <h2>Sanity changes this session</h2>
      <p>
        <em>
          TODO (#013 follow-up): surface san_change_events filtered by sessionId (loose ref already
          stored).
        </em>
      </p>
    </section>
  )
}

export default SessionDetailPage
