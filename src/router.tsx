/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ComponentType, type ReactElement } from 'react'
import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout'
import PageFallback from './components/ui/PageFallback'
import { ENTITIES } from './entities'
import EntityStubPage from './pages/EntityStubPage'
import HomePage from './pages/HomePage'

// Lazy-loaded page components — each gets its own JS chunk so initial
// load is small and entity navigation pulls in only what's needed.
const ClueDetailPage = lazy(() => import('./pages/clues/ClueDetailPage'))
const ClueListPage = lazy(() => import('./pages/clues/ClueListPage'))
const NewCluePage = lazy(() => import('./pages/clues/NewCluePage'))
const FactionDetailPage = lazy(() => import('./pages/factions/FactionDetailPage'))
const FactionListPage = lazy(() => import('./pages/factions/FactionListPage'))
const NewFactionPage = lazy(() => import('./pages/factions/NewFactionPage'))
const ItemDetailPage = lazy(() => import('./pages/items/ItemDetailPage'))
const ItemListPage = lazy(() => import('./pages/items/ItemListPage'))
const NewItemPage = lazy(() => import('./pages/items/NewItemPage'))
const LocationDetailPage = lazy(() => import('./pages/locations/LocationDetailPage'))
const LocationListPage = lazy(() => import('./pages/locations/LocationListPage'))
const NewLocationPage = lazy(() => import('./pages/locations/NewLocationPage'))
const NewNpcPage = lazy(() => import('./pages/npcs/NewNpcPage'))
const NpcDetailPage = lazy(() => import('./pages/npcs/NpcDetailPage'))
const NpcListPage = lazy(() => import('./pages/npcs/NpcListPage'))
const NewPcPage = lazy(() => import('./pages/pcs/NewPcPage'))
const PcDetailPage = lazy(() => import('./pages/pcs/PcDetailPage'))
const PcListPage = lazy(() => import('./pages/pcs/PcListPage'))
const ImportPage = lazy(() => import('./pages/import/ImportPage'))
const NewScenarioPage = lazy(() => import('./pages/scenarios/NewScenarioPage'))
const ScenarioDetailPage = lazy(() => import('./pages/scenarios/ScenarioDetailPage'))
const ScenarioListPage = lazy(() => import('./pages/scenarios/ScenarioListPage'))
const NewScenePage = lazy(() => import('./pages/scenes/NewScenePage'))
const SceneDetailPage = lazy(() => import('./pages/scenes/SceneDetailPage'))
const SceneListPage = lazy(() => import('./pages/scenes/SceneListPage'))
const NewSessionPage = lazy(() => import('./pages/sessions/NewSessionPage'))
const SessionDetailPage = lazy(() => import('./pages/sessions/SessionDetailPage'))
const SessionListPage = lazy(() => import('./pages/sessions/SessionListPage'))

// Tight per-route Suspense boundary so fallback localizes to page slot.
function withSuspense(El: ComponentType): ReactElement {
  return (
    <Suspense fallback={<PageFallback />}>
      <El />
    </Suspense>
  )
}

const entityRoutes = ENTITIES.flatMap((entity) => {
  if (entity.key === 'pcs') {
    return [
      { path: 'pcs', element: withSuspense(PcListPage) },
      { path: 'pcs/new', element: withSuspense(NewPcPage) },
      { path: 'pcs/:id', element: withSuspense(PcDetailPage) },
    ]
  }
  if (entity.key === 'npcs') {
    return [
      { path: 'npcs', element: withSuspense(NpcListPage) },
      { path: 'npcs/new', element: withSuspense(NewNpcPage) },
      { path: 'npcs/:id', element: withSuspense(NpcDetailPage) },
    ]
  }
  if (entity.key === 'factions') {
    return [
      { path: 'factions', element: withSuspense(FactionListPage) },
      { path: 'factions/new', element: withSuspense(NewFactionPage) },
      { path: 'factions/:id', element: withSuspense(FactionDetailPage) },
    ]
  }
  if (entity.key === 'locations') {
    return [
      { path: 'locations', element: withSuspense(LocationListPage) },
      { path: 'locations/new', element: withSuspense(NewLocationPage) },
      { path: 'locations/:id', element: withSuspense(LocationDetailPage) },
    ]
  }
  if (entity.key === 'clues') {
    return [
      { path: 'clues', element: withSuspense(ClueListPage) },
      { path: 'clues/new', element: withSuspense(NewCluePage) },
      { path: 'clues/:id', element: withSuspense(ClueDetailPage) },
    ]
  }
  if (entity.key === 'items') {
    return [
      { path: 'items', element: withSuspense(ItemListPage) },
      { path: 'items/new', element: withSuspense(NewItemPage) },
      { path: 'items/:id', element: withSuspense(ItemDetailPage) },
    ]
  }
  if (entity.key === 'scenarios') {
    return [
      { path: 'scenarios', element: withSuspense(ScenarioListPage) },
      { path: 'scenarios/new', element: withSuspense(NewScenarioPage) },
      { path: 'scenarios/:id', element: withSuspense(ScenarioDetailPage) },
    ]
  }
  if (entity.key === 'scenes') {
    return [
      { path: 'scenes', element: withSuspense(SceneListPage) },
      { path: 'scenes/new', element: withSuspense(NewScenePage) },
      { path: 'scenes/:id', element: withSuspense(SceneDetailPage) },
    ]
  }
  if (entity.key === 'sessions') {
    return [
      { path: 'sessions', element: withSuspense(SessionListPage) },
      { path: 'sessions/new', element: withSuspense(NewSessionPage) },
      { path: 'sessions/:id', element: withSuspense(SessionDetailPage) },
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
    children: [
      { index: true, Component: HomePage },
      { path: 'import', element: withSuspense(ImportPage) },
      ...entityRoutes,
    ],
  },
])
