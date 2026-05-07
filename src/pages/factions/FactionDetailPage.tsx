import { Link, useParams } from 'react-router'
import DeleteEntityButton from '../../components/DeleteEntityButton/DeleteEntityButton'
import EntityRecentActivity from '../../components/EntityRecentActivity/EntityRecentActivity'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import FactionContext from '../../components/FactionContext/FactionContext'
import Card from '../../components/ui/Card'
import EditOnly from '../../components/ui/EditOnly'
import Heading from '../../components/ui/Heading'
import Inline from '../../components/ui/Inline'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useDeleteFaction } from '../../hooks/useDeleteFaction'
import { useFaction } from '../../hooks/useFactions'

function FactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: faction, isLoading, error } = useFaction(id)
  const deleteFaction = useDeleteFaction()

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!faction) return <p>Faction not found.</p>

  return (
    <Stack gap="md">
      <p>
        <Link to="/factions">← All Factions</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{faction.name}</Heading>
        <Inline gap="sm">
          <LinkButton href={`/api/factions/${faction.id}/export`} variant="ghost" download>
            Download as Markdown
          </LinkButton>
          <EditOnly>
            <LinkButton to={`/factions/${faction.id}/edit`} variant="ghost">
              Edit
            </LinkButton>
          </EditOnly>
          <EditOnly>
            <DeleteEntityButton
              onConfirm={() => deleteFaction.mutateAsync(faction.id).then(() => undefined)}
              entityLabel="faction"
              entityName={faction.name}
              redirectTo="/factions"
            />
          </EditOnly>
        </Inline>
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

      {id && <FactionContext factionId={id} />}
      {id && <EntityRelationships entityType="faction" entityId={id} />}
      {id && <EntityRecentActivity entityType="faction" entityId={id} />}
    </Stack>
  )
}

export default FactionDetailPage
