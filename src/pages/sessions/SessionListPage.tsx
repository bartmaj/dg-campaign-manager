import { useState } from 'react'
import { Link } from 'react-router'
import type { SessionOrderBy } from '../../api/sessions'
import { useSessions } from '../../hooks/useSessions'

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return '—'
  if (start && end) return `${start} – ${end}`
  return start ?? end ?? '—'
}

function formatRealWorld(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? d : dt.toISOString().slice(0, 10)
}

function SessionListPage() {
  const [orderBy, setOrderBy] = useState<SessionOrderBy>('realWorld')
  const { data, isLoading, error } = useSessions(orderBy)

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Sessions</h1>
        <Link to="/sessions/new">+ New session</Link>
      </header>

      <div role="group" aria-label="Timeline order" style={{ margin: '0.5rem 0' }}>
        <button
          type="button"
          aria-pressed={orderBy === 'realWorld'}
          onClick={() => setOrderBy('realWorld')}
          disabled={orderBy === 'realWorld'}
        >
          Real-world order
        </button>{' '}
        <button
          type="button"
          aria-pressed={orderBy === 'inGame'}
          onClick={() => setOrderBy('inGame')}
          disabled={orderBy === 'inGame'}
        >
          In-game order
        </button>
      </div>

      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No sessions yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((s) => {
            const preview = s.description
              ? s.description.length > 80
                ? `${s.description.slice(0, 80)}…`
                : s.description
              : null
            return (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`}>{s.name}</Link>
                {' — IRL: '}
                {formatRealWorld(s.realWorldDate)}
                {' — In-game: '}
                {formatRange(s.inGameDate, s.inGameDateEnd)}
                {preview ? ` — ${preview}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default SessionListPage
