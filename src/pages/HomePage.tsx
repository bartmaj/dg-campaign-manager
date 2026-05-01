import { Link } from 'react-router'
import { ENTITIES } from '../entities'

function HomePage() {
  return (
    <section>
      <h1>Delta Green Campaign Manager</h1>
      <p>
        GM workbench for prepping and running tabletop sessions of <em>Delta Green</em>. Pick an
        entity type to begin.
      </p>
      <ul>
        {ENTITIES.map((entity) => (
          <li key={entity.key}>
            <Link to={entity.path}>{entity.label}</Link> — full UI lands in {entity.futureIssue}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default HomePage
