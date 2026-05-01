import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout'
import { ENTITIES } from './entities'
import EntityStubPage from './pages/EntityStubPage'
import HomePage from './pages/HomePage'

const entityRoutes = ENTITIES.flatMap((entity) => [
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
])

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [{ index: true, Component: HomePage }, ...entityRoutes],
  },
])
