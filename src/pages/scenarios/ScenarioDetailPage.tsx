import { Link, useParams } from 'react-router'
import Card from '../../components/ui/Card'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useScenario, useScenarios } from '../../hooks/useScenarios'
import { useScenes } from '../../hooks/useScenes'

function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: scenario, isLoading, error } = useScenario(id)
  const { data: scenes = [] } = useScenes(id)
  // Pre-fetch scenarios list so the back link is responsive.
  useScenarios()

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!scenario) return <p>Scenario not found.</p>

  return (
    <Stack gap="md">
      <p>
        <Link to="/scenarios">← All Scenarios</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{scenario.name}</Heading>
        <LinkButton href={`/api/scenarios/${scenario.id}/export`} variant="ghost" download>
          Download as Markdown
        </LinkButton>
      </Toolbar>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Description</Heading>
          <Prose>{scenario.description ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Toolbar align="between">
            <Heading level={2}>Scenes</Heading>
            <LinkButton
              to={`/scenes/new?scenarioId=${encodeURIComponent(scenario.id)}`}
              variant="primary"
              size="sm"
            >
              + New scene
            </LinkButton>
          </Toolbar>
          {scenes.length === 0 ? (
            <p>—</p>
          ) : (
            <ol>
              {scenes.map((s) => (
                <li key={s.id}>
                  <Link to={`/scenes/${s.id}`}>{s.name}</Link>
                  {s.description ? ` — ${s.description.slice(0, 80)}` : ''}
                </li>
              ))}
            </ol>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

export default ScenarioDetailPage
