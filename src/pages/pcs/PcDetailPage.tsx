import { Link, useParams } from 'react-router'
import { usePc } from '../../hooks/usePcs'

function PcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: pc, isLoading, error } = usePc(id)

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

      <h2>Bonds (M2)</h2>
      <p>
        <em>Bond mechanics arrive in #011.</em>
      </p>

      <h2>Sanity (M2)</h2>
      <p>
        <em>SAN block — current: {pc.sanityCurrent ?? pc.sanMax}. Full mechanics in #012.</em>
      </p>
    </section>
  )
}

export default PcDetailPage
