import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout'
import { ENTITIES } from './entities'
import EntityStubPage from './pages/EntityStubPage'
import FactionDetailPage from './pages/factions/FactionDetailPage'
import FactionListPage from './pages/factions/FactionListPage'
import NewFactionPage from './pages/factions/NewFactionPage'
import HomePage from './pages/HomePage'
import ItemDetailPage from './pages/items/ItemDetailPage'
import ItemListPage from './pages/items/ItemListPage'
import NewItemPage from './pages/items/NewItemPage'
import LocationDetailPage from './pages/locations/LocationDetailPage'
import LocationListPage from './pages/locations/LocationListPage'
import NewLocationPage from './pages/locations/NewLocationPage'
import NewNpcPage from './pages/npcs/NewNpcPage'
import NpcDetailPage from './pages/npcs/NpcDetailPage'
import NpcListPage from './pages/npcs/NpcListPage'
import NewPcPage from './pages/pcs/NewPcPage'
import PcDetailPage from './pages/pcs/PcDetailPage'
import PcListPage from './pages/pcs/PcListPage'

const entityRoutes = ENTITIES.flatMap((entity) => {
  if (entity.key === 'pcs') {
    return [
      { path: 'pcs', element: <PcListPage /> },
      { path: 'pcs/new', element: <NewPcPage /> },
      { path: 'pcs/:id', element: <PcDetailPage /> },
    ]
  }
  if (entity.key === 'npcs') {
    return [
      { path: 'npcs', element: <NpcListPage /> },
      { path: 'npcs/new', element: <NewNpcPage /> },
      { path: 'npcs/:id', element: <NpcDetailPage /> },
    ]
  }
  if (entity.key === 'factions') {
    return [
      { path: 'factions', element: <FactionListPage /> },
      { path: 'factions/new', element: <NewFactionPage /> },
      { path: 'factions/:id', element: <FactionDetailPage /> },
    ]
  }
  if (entity.key === 'locations') {
    return [
      { path: 'locations', element: <LocationListPage /> },
      { path: 'locations/new', element: <NewLocationPage /> },
      { path: 'locations/:id', element: <LocationDetailPage /> },
    ]
  }
  if (entity.key === 'items') {
    return [
      { path: 'items', element: <ItemListPage /> },
      { path: 'items/new', element: <NewItemPage /> },
      { path: 'items/:id', element: <ItemDetailPage /> },
    ]
  }
  return [
    {
      path: entity.path.slice(1),
      element: <EntityStubPage entity={entity} variant="list" />,
    },
    {
      path: `${entity.path.slice(1)}/new`,
      element: <EntityStubPage entity={entity} variant="new" />,
    },
    {
      path: `${entity.path.slice(1)}/:id`,
      element: <EntityStubPage entity={entity} variant="detail" />,
    },
  ]
})

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [{ index: true, Component: HomePage }, ...entityRoutes],
  },
])
