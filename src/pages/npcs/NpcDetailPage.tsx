import { Link, useParams } from 'react-router'
import type { NpcStatus } from '../../../domain/npc'
import { useIncomingBonds } from '../../hooks/useBonds'
import { useNpc } from '../../hooks/useNpcs'

const STATUS_COLOR: Record<NpcStatus, string> = {
  alive: '#2e7d32',
  dead: '#5a5a5a',
  missing: '#b8860b',
  turned: '#8b0000',
}

function StatusChip({ status }: { status: NpcStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        background: STATUS_COLOR[status],
        color: 'white',
        fontSize: '0.85em',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {status}
    </span>
  )
}

function NpcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: npc, isLoading, error } = useNpc(id)
  const { data: incomingBonds = [] } = useIncomingBonds('npc', id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!npc) return <p>NPC not found.</p>

  const hasFullStats = npc.str !== null && npc.con !== null && npc.dex !== null

  return (
    <section>
      <p>
        <Link to="/npcs">← All NPCs</Link>
      </p>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>{npc.name}</h1>
        {/* Continuity dimension #4: Status */}
        <StatusChip status={npc.status} />
      </header>
      {npc.profession && <p>Profession: {npc.profession}</p>}

      <h2>Stat block</h2>
      {hasFullStats ? (
        <table>
          <tbody>
            <tr>
              <td>STR</td>
              <td>{npc.str}</td>
              <td>CON</td>
              <td>{npc.con}</td>
              <td>DEX</td>
              <td>{npc.dex}</td>
            </tr>
            <tr>
              <td>INT</td>
              <td>{npc.intelligence}</td>
              <td>POW</td>
              <td>{npc.pow}</td>
              <td>CHA</td>
              <td>{npc.cha}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>
          <em>Simplified.</em>
        </p>
      )}
      <p>
        HP: {npc.hp ?? '—'} · WP: {npc.wp ?? '—'}
      </p>

      {/* Continuity dimension #1: RP hooks */}
      <h2>RP hooks</h2>
      <dl>
        <dt>Mannerisms</dt>
        <dd style={{ whiteSpace: 'pre-wrap' }}>{npc.mannerisms ?? '—'}</dd>
        <dt>Voice</dt>
        <dd>{npc.voice ?? '—'}</dd>
        <dt>Secrets</dt>
        <dd style={{ whiteSpace: 'pre-wrap' }}>{npc.secrets ?? '—'}</dd>
      </dl>

      {/* Continuity dimension #2: Faction */}
      <h2>Faction</h2>
      <p>{npc.factionId ?? '—'}</p>

      {/* Continuity dimension #3: Relationship web */}
      <h2>Relationships</h2>
      <p>
        <em>Relationships — surfaced in M2.2A via polymorphic edges.</em>
      </p>

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

      <h2>Current goal</h2>
      <p>{npc.currentGoal ?? '—'}</p>

      <h2>Location</h2>
      <p>{npc.locationId ?? '—'}</p>
    </section>
  )
}

export default NpcDetailPage
