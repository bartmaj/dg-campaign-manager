import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { BondTargetType } from '../../../domain/bonds'
import type { BondRow } from '../../api/bonds'
import { useApplyBondDamage } from '../../hooks/useApplyBondDamage'
import { useBond, useBondsForPc, useIncomingBonds } from '../../hooks/useBonds'
import { useCreateBond } from '../../hooks/useCreateBond'
import { useDeleteBond } from '../../hooks/useDeleteBond'
import { usePc } from '../../hooks/usePcs'

function BondRowView({ bond }: { bond: BondRow }) {
  const { data, isLoading } = useBond(bond.id)
  const apply = useApplyBondDamage()
  const remove = useDeleteBond()
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const events = data?.events ?? []
  const visibleEvents = showAll ? events : events.slice(-3).reverse()

  async function onApply(e: React.FormEvent, sign: 1 | -1) {
    e.preventDefault()
    setFormError(null)
    const magnitude = Number.parseInt(delta, 10)
    if (!Number.isFinite(magnitude) || magnitude <= 0) {
      setFormError('Enter a positive integer.')
      return
    }
    try {
      await apply.mutateAsync({
        bondId: bond.id,
        input: {
          delta: sign * magnitude,
          reason: reason.trim() === '' ? null : reason.trim(),
          sessionId: sessionId.trim() === '' ? null : sessionId.trim(),
        },
      })
      setDelta('')
      setReason('')
      setSessionId('')
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  // Use the freshly-mutated bond (server-returned) when available; falls
  // back to the list-row data while the detail query is loading.
  const current = data?.bond.currentScore ?? bond.currentScore
  const max = data?.bond.maxScore ?? bond.maxScore

  return (
    <li style={{ marginBottom: '1rem' }}>
      <strong>{bond.name}</strong> — {current} / {max}
      {' · '}
      <Link to={`/${bond.targetType}s/${bond.targetId}`}>
        {bond.targetType}: {bond.targetId}
      </Link>
      {bond.description ? <p style={{ margin: '0.25rem 0' }}>{bond.description}</p> : null}
      <form
        onSubmit={(e) => void onApply(e, -1)}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <input
          type="number"
          min="1"
          step="1"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="amount"
          aria-label="Damage amount"
          style={{ width: '6rem' }}
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="reason"
          aria-label="Reason"
        />
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="session id (optional)"
          aria-label="Session ID"
        />
        <button type="submit" disabled={apply.isPending}>
          Damage
        </button>
        <button type="button" disabled={apply.isPending} onClick={(e) => void onApply(e, 1)}>
          Repair
        </button>
        <button
          type="button"
          onClick={() => void remove.mutateAsync(bond.id)}
          disabled={remove.isPending}
        >
          ✕ Delete bond
        </button>
      </form>
      {formError && <p style={{ color: 'crimson' }}>{formError}</p>}
      <details open={false}>
        <summary>History {isLoading ? '(loading…)' : `(${events.length})`}</summary>
        {events.length === 0 ? (
          <p>—</p>
        ) : (
          <>
            <ul>
              {visibleEvents.map((ev) => (
                <li key={ev.id}>
                  <strong>{ev.delta > 0 ? `+${ev.delta}` : ev.delta}</strong>
                  {ev.reason ? ` — ${ev.reason}` : ''}
                  {ev.sessionId ? ` · session ${ev.sessionId}` : ''}
                  {' · '}
                  <em>{new Date(ev.appliedAt).toLocaleString()}</em>
                </li>
              ))}
            </ul>
            {events.length > 3 && (
              <button type="button" onClick={() => setShowAll((s) => !s)}>
                {showAll ? 'Show last 3' : `View all ${events.length}`}
              </button>
            )}
          </>
        )}
      </details>
    </li>
  )
}

function AddBondForm({ pcId }: { pcId: string }) {
  const create = useCreateBond()
  const [name, setName] = useState('')
  const [targetType, setTargetType] = useState<BondTargetType>('npc')
  const [targetId, setTargetId] = useState('')
  const [maxScore, setMaxScore] = useState('12')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const max = Number.parseInt(maxScore, 10)
    if (!Number.isFinite(max) || max < 0) {
      setFormError('Max score must be a non-negative integer.')
      return
    }
    if (name.trim() === '' || targetId.trim() === '') {
      setFormError('Name and target id are required.')
      return
    }
    try {
      await create.mutateAsync({
        pcId,
        name: name.trim(),
        targetType,
        targetId: targetId.trim(),
        maxScore: max,
        description: description.trim() === '' ? null : description.trim(),
      })
      setName('')
      setTargetId('')
      setMaxScore('12')
      setDescription('')
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <p>
        <label htmlFor="bond-name">Name</label>
        <br />
        <input
          id="bond-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sister Mary"
        />
      </p>
      <p>
        <label htmlFor="bond-target-type">Target type</label>
        <br />
        <select
          id="bond-target-type"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as BondTargetType)}
        >
          <option value="npc">NPC</option>
          <option value="pc">PC</option>
        </select>
      </p>
      <p>
        <label htmlFor="bond-target-id">Target ID</label>
        <br />
        <input
          id="bond-target-id"
          type="text"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="UUID"
        />
      </p>
      <p>
        <label htmlFor="bond-max">Max score</label>
        <br />
        <input
          id="bond-max"
          type="number"
          min="0"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
        />
      </p>
      <p>
        <label htmlFor="bond-desc">Description (optional)</label>
        <br />
        <input
          id="bond-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </p>
      <button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Adding…' : 'Add Bond'}
      </button>
      {formError && <p style={{ color: 'crimson' }}>{formError}</p>}
    </form>
  )
}

function PcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: pc, isLoading, error } = usePc(id)
  const { data: bonds = [] } = useBondsForPc(id)
  const { data: incomingBonds = [] } = useIncomingBonds('pc', id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!pc) return <p>PC not found.</p>

  return (
    <section>
      <p>
        <Link to="/pcs">← All PCs</Link>
      </p>
      <h1>{pc.name}</h1>
      {pc.profession && <p>Profession: {pc.profession}</p>}

      <h2>Stats</h2>
      <table>
        <tbody>
          <tr>
            <td>STR</td>
            <td>{pc.str}</td>
            <td>CON</td>
            <td>{pc.con}</td>
            <td>DEX</td>
            <td>{pc.dex}</td>
          </tr>
          <tr>
            <td>INT</td>
            <td>{pc.intelligence}</td>
            <td>POW</td>
            <td>{pc.pow}</td>
            <td>CHA</td>
            <td>{pc.cha}</td>
          </tr>
        </tbody>
      </table>

      <h2>Derived</h2>
      <ul>
        <li>HP: {pc.hp}</li>
        <li>WP: {pc.wp}</li>
        <li>Breaking Point: {pc.bp}</li>
        <li>SAN max: {pc.sanMax}</li>
      </ul>

      <h2>Skills</h2>
      {pc.skills && pc.skills.length > 0 ? (
        <ul>
          {pc.skills.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              {s.name}: {s.rating}
            </li>
          ))}
        </ul>
      ) : (
        <p>No skills recorded.</p>
      )}

      <h2>Motivations</h2>
      {pc.motivations && pc.motivations.length > 0 ? (
        <ul>
          {pc.motivations.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : (
        <p>No motivations recorded.</p>
      )}

      <h2>Backstory hooks</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{pc.backstoryHooks ?? '—'}</p>

      <h2>Bonds</h2>
      {bonds.length === 0 ? (
        <p>No bonds yet.</p>
      ) : (
        <ul>
          {bonds.map((b) => (
            <BondRowView key={b.id} bond={b} />
          ))}
        </ul>
      )}

      <h3>Add Bond</h3>
      {id && <AddBondForm pcId={id} />}

      <h2>Bonds with this character</h2>
      {incomingBonds.length === 0 ? (
        <p>—</p>
      ) : (
        <ul>
          {incomingBonds.map((b) => (
            <li key={b.id}>
              <Link to={`/pcs/${b.pcId}`}>{b.pcId}</Link>: {b.name} ({b.currentScore}/{b.maxScore})
            </li>
          ))}
        </ul>
      )}

      <h2>Sanity (M2)</h2>
      <p>
        <em>SAN block — current: {pc.sanityCurrent ?? pc.sanMax}. Full mechanics in #012.</em>
      </p>
    </section>
  )
}

export default PcDetailPage
