import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout'
import { ENTITIES } from './entities'
import EntityStubPage from './pages/EntityStubPage'
import HomePage from './pages/HomePage'
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
