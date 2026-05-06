import { Link, useParams } from 'react-router'
import DeleteEntityButton from '../../components/DeleteEntityButton/DeleteEntityButton'
import EntityRecentActivity from '../../components/EntityRecentActivity/EntityRecentActivity'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import Card from '../../components/ui/Card'
import EditOnly from '../../components/ui/EditOnly'
import Heading from '../../components/ui/Heading'
import Inline from '../../components/ui/Inline'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useDeleteItem } from '../../hooks/useDeleteItem'
import { useItem } from '../../hooks/useItems'

function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading, error } = useItem(id)
  const deleteItem = useDeleteItem()

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
        <Inline gap="sm">
          <LinkButton href={`/api/items/${item.id}/export`} variant="ghost" download>
            Download as Markdown
          </LinkButton>
          <EditOnly>
            <DeleteEntityButton
              onConfirm={() => deleteItem.mutateAsync(item.id).then(() => undefined)}
              entityLabel="item"
              entityName={item.name}
              redirectTo="/items"
            />
          </EditOnly>
        </Inline>
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

      {id && <EntityRelationships entityType="item" entityId={id} />}
      {id && <EntityRecentActivity entityType="item" entityId={id} />}
    </Stack>
  )
}

export default ItemDetailPage
