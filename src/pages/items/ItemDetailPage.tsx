import { Link, useParams } from 'react-router'
import { useItem } from '../../hooks/useItems'

function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading, error } = useItem(id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
  if (!item) return <p>Item not found.</p>

  return (
    <section>
      <p>
        <Link to="/items">← All Items</Link>
      </p>
      <h1>{item.name}</h1>

      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{item.description ?? '—'}</p>

      <h2>History</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{item.history ?? '—'}</p>

      <h2>Owner</h2>
      <p>
        {item.ownerNpcId ? <Link to={`/npcs/${item.ownerNpcId}`}>{item.ownerNpcId}</Link> : '—'}
      </p>

      <h2>Location</h2>
      <p>
        {item.locationId ? (
          <Link to={`/locations/${item.locationId}`}>{item.locationId}</Link>
        ) : (
          '—'
        )}
      </p>
    </section>
  )
}

export default ItemDetailPage
