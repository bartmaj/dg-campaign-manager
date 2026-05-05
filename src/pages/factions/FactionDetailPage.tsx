import { Link, useParams } from 'react-router'
import EntityRecentActivity from '../../components/EntityRecentActivity/EntityRecentActivity'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import Card from '../../components/ui/Card'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useFaction } from '../../hooks/useFactions'
import { useIncomingEdges } from '../../hooks/useEdges'

function FactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: faction, isLoading, error } = useFaction(id)
  const { data: incomingEdges = [] } = useIncomingEdges('faction', id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!faction) return <p>Faction not found.</p>

  const implicatingClues = incomingEdges.filter(
    (e) => e.sourceType === 'clue' && e.kind === 'implicates',
  )

  return (
    <Stack gap="md">
      <p>
        <Link to="/factions">← All Factions</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{faction.name}</Heading>
        <LinkButton href={`/api/factions/${faction.id}/export`} variant="ghost" download>
          Download as Markdown
        </LinkButton>
      </Toolbar>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Agenda</Heading>
          <Prose>{faction.agenda ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Description</Heading>
          <Prose>{faction.description ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Implicating clues</Heading>
          {implicatingClues.length === 0 ? (
            <p>—</p>
          ) : (
            <ul>
              {implicatingClues.map((edge) => (
                <li key={edge.id}>
                  <Link to={`/clues/${edge.sourceId}`}>{edge.sourceId}</Link>
                  {edge.notes ? ` — ${edge.notes}` : null}
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Members</Heading>
          <p>
            <em>Member NPCs — surfaced in M2.2A via polymorphic edges.</em>
          </p>
        </Stack>
      </Card>

      {id && <EntityRelationships entityType="faction" entityId={id} />}
      {id && <EntityRecentActivity entityType="faction" entityId={id} />}
    </Stack>
  )
}

export default FactionDetailPage
