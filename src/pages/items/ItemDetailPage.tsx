import { Link, useParams } from 'react-router'
import Card from '../../components/ui/Card'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useItem } from '../../hooks/useItems'

function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading, error } = useItem(id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!item) return <p>Item not found.</p>

  return (
    <Stack gap="md">
      <p>
        <Link to="/items">← All Items</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{item.name}</Heading>
        <LinkButton href={`/api/items/${item.id}/export`} variant="ghost" download>
          Download as Markdown
        </LinkButton>
      </Toolbar>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Description</Heading>
          <Prose>{item.description ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>History</Heading>
          <Prose>{item.history ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Owner</Heading>
          <p>
            {item.ownerNpcId ? <Link to={`/npcs/${item.ownerNpcId}`}>{item.ownerNpcId}</Link> : '—'}
          </p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Location</Heading>
          <p>
            {item.locationId ? (
              <Link to={`/locations/${item.locationId}`}>{item.locationId}</Link>
            ) : (
              '—'
            )}
          </p>
        </Stack>
      </Card>
    </Stack>
  )
}

export default ItemDetailPage
