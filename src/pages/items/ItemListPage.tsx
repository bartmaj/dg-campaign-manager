import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { ItemFilter } from '../../api/items'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import { useItems } from '../../hooks/useItems'

function ItemListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})

  const filter: ItemFilter = useMemo(() => {
    const next: ItemFilter = {}
    if (filterValues.locationId) next.locationId = filterValues.locationId
    if (filterValues.ownerNpcId) next.ownerNpcId = filterValues.ownerNpcId
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useItems(filter)

  const fields: FilterBarField[] = [
    { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
    { id: 'locationId', label: 'Location ID', type: 'text', placeholder: 'location id' },
    { id: 'ownerNpcId', label: 'Owner NPC ID', type: 'text', placeholder: 'npc id' },
  ]

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Items</h1>
        <Link to="/items/new">+ New Item</Link>
      </header>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <p>No items match the current filters.</p>}
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
