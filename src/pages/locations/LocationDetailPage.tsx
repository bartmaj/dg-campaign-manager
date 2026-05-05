import { Link, useParams } from 'react-router'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import LocationContext from '../../components/LocationContext/LocationContext'
import Card from '../../components/ui/Card'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useLocation } from '../../hooks/useLocations'

function LocationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: location, isLoading, error } = useLocation(id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!location) return <p>Location not found.</p>

  return (
    <Stack gap="md">
      <p>
        <Link to="/locations">← All Locations</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{location.name}</Heading>
        <LinkButton href={`/api/locations/${location.id}/export`} variant="ghost" download>
          Download as Markdown
        </LinkButton>
      </Toolbar>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Description</Heading>
          <Prose>{location.description ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Parent Location</Heading>
          <p>
            {location.parentLocationId ? (
              <Link to={`/locations/${location.parentLocationId}`}>
                {location.parentLocationId}
              </Link>
            ) : (
              '—'
            )}
          </p>
        </Stack>
      </Card>

      {id && <LocationContext locationId={id} />}
      {id && <EntityRelationships entityType="location" entityId={id} />}
    </Stack>
  )
}

export default LocationDetailPage
