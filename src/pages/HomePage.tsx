import { Link } from 'react-router'
import { ENTITIES } from '../entities'
import Heading from '../components/ui/Heading'
import Stack from '../components/ui/Stack'

function HomePage() {
  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <Heading level={1}>Delta Green Campaign Manager</Heading>
        <p className="text-sm text-ink-muted max-w-prose">
          GM workbench for prepping and running tabletop sessions of <em>Delta Green</em>. Pick an
          entity type to begin.
        </p>
      </Stack>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {ENTITIES.map((entity) => (
          <li
            key={entity.key}
            className="flex items-baseline gap-3 border-b border-border pb-2 last:border-b-0"
          >
            <Link
              to={entity.path}
              className="text-sm font-medium text-accent no-underline hover:underline min-w-[8rem]"
            >
              {entity.label}
            </Link>
            <span className="text-xs text-ink-muted">
              full UI lands in <span className="font-mono">{entity.futureIssue}</span>
            </span>
          </li>
        ))}
      </ul>
    </Stack>
  )
}

export default HomePage
