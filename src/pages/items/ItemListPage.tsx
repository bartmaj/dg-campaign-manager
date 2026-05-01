import { Link } from 'react-router'
import { useItems } from '../../hooks/useItems'

function ItemListPage() {
  const { data, isLoading, error } = useItems()

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Items</h1>
        <Link to="/items/new">+ New Item</Link>
      </header>
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No items yet.</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((item) => (
            <li key={item.id}>
              <Link to={`/items/${item.id}`}>{item.name}</Link>
              {item.ownerNpcId ? ` · owner: ${item.ownerNpcId}` : ''}
              {item.locationId ? ` · at: ${item.locationId}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ItemListPage
