// useLinkPrefetch — returns event handlers that, on first hover/focus,
// (a) preload the destination route's JS chunk and (b) prefetch the
// destination's GET endpoint into TanStack Query cache.
//
// Idempotent: TanStack Query's stale-time naturally dedupes repeat calls,
// and we additionally guard the dynamic import per (path × hook instance).
//
// The hook is intentionally generic over the path string. Path → entity
// resolution is done by parsing the URL pattern `/<entity>/<id>`.
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import { getClue } from '../api/clues'
import { getFaction } from '../api/factions'
import { getItem } from '../api/items'
import { getLocation } from '../api/locations'
import { getNpc } from '../api/npcs'
import { getPc } from '../api/pcs'
import { getScenario } from '../api/scenarios'
import { getScene } from '../api/scenes'
import { getSession } from '../api/sessions'
import { clueKeys } from './useClues'
import { factionKeys } from './useFactions'
import { itemKeys } from './useItems'
import { locationKeys } from './useLocations'
import { npcKeys } from './useNpcs'
import { pcKeys } from './usePcs'
import { scenarioKeys } from './useScenarios'
import { sceneKeys } from './useScenes'
import { sessionKeys } from './useSessions'

type EntityKey =
  | 'pcs'
  | 'npcs'
  | 'factions'
  | 'locations'
  | 'clues'
  | 'items'
  | 'scenarios'
  | 'scenes'
  | 'sessions'

type PrefetchSpec = {
  // queryKey returned for the destination detail
  // we pass id through and let the spec build the full key
  keyFor: (id: string) => readonly unknown[]
  fetch: (id: string) => Promise<unknown>
  // dynamic import for the corresponding *DetailPage chunk
  importDetail: () => Promise<unknown>
  // dynamic import for the corresponding *ListPage chunk
  importList: () => Promise<unknown>
  // dynamic import for the corresponding *NewPage chunk
  importNew: () => Promise<unknown>
}

const SPECS: Record<EntityKey, PrefetchSpec> = {
  pcs: {
    keyFor: (id) => pcKeys.detail(id),
    fetch: (id) => getPc(id),
    importDetail: () => import('../pages/pcs/PcDetailPage'),
    importList: () => import('../pages/pcs/PcListPage'),
    importNew: () => import('../pages/pcs/NewPcPage'),
  },
  npcs: {
    keyFor: (id) => npcKeys.detail(id),
    fetch: (id) => getNpc(id),
    importDetail: () => import('../pages/npcs/NpcDetailPage'),
    importList: () => import('../pages/npcs/NpcListPage'),
    importNew: () => import('../pages/npcs/NewNpcPage'),
  },
  factions: {
    keyFor: (id) => factionKeys.detail(id),
    fetch: (id) => getFaction(id),
    importDetail: () => import('../pages/factions/FactionDetailPage'),
    importList: () => import('../pages/factions/FactionListPage'),
    importNew: () => import('../pages/factions/NewFactionPage'),
  },
  locations: {
    keyFor: (id) => locationKeys.detail(id),
    fetch: (id) => getLocation(id),
    importDetail: () => import('../pages/locations/LocationDetailPage'),
    importList: () => import('../pages/locations/LocationListPage'),
    importNew: () => import('../pages/locations/NewLocationPage'),
  },
  clues: {
    keyFor: (id) => clueKeys.detail(id),
    fetch: (id) => getClue(id),
    importDetail: () => import('../pages/clues/ClueDetailPage'),
    importList: () => import('../pages/clues/ClueListPage'),
    importNew: () => import('../pages/clues/NewCluePage'),
  },
  items: {
    keyFor: (id) => itemKeys.detail(id),
    fetch: (id) => getItem(id),
    importDetail: () => import('../pages/items/ItemDetailPage'),
    importList: () => import('../pages/items/ItemListPage'),
    importNew: () => import('../pages/items/NewItemPage'),
  },
  scenarios: {
    keyFor: (id) => scenarioKeys.detail(id),
    fetch: (id) => getScenario(id),
    importDetail: () => import('../pages/scenarios/ScenarioDetailPage'),
    importList: () => import('../pages/scenarios/ScenarioListPage'),
    importNew: () => import('../pages/scenarios/NewScenarioPage'),
  },
  scenes: {
    keyFor: (id) => sceneKeys.detail(id),
    fetch: (id) => getScene(id),
    importDetail: () => import('../pages/scenes/SceneDetailPage'),
    importList: () => import('../pages/scenes/SceneListPage'),
    importNew: () => import('../pages/scenes/NewScenePage'),
  },
  sessions: {
    keyFor: (id) => sessionKeys.detail(id),
    fetch: (id) => getSession(id),
    importDetail: () => import('../pages/sessions/SessionDetailPage'),
    importList: () => import('../pages/sessions/SessionListPage'),
    importNew: () => import('../pages/sessions/NewSessionPage'),
  },
}

const ENTITY_KEYS = Object.keys(SPECS) as EntityKey[]

type Parsed =
  | { kind: 'list'; entity: EntityKey }
  | { kind: 'new'; entity: EntityKey }
  | { kind: 'detail'; entity: EntityKey; id: string }
  | { kind: 'unknown' }

export function parsePrefetchPath(path: string): Parsed {
  // strip query/hash
  const clean = (path.split('?')[0] ?? path).split('#')[0] ?? ''
  const segs = clean.split('/').filter(Boolean)
  if (segs.length === 0) return { kind: 'unknown' }
  const head = segs[0] as EntityKey
  if (!ENTITY_KEYS.includes(head)) return { kind: 'unknown' }
  if (segs.length === 1) return { kind: 'list', entity: head }
  if (segs.length === 2 && segs[1] === 'new') return { kind: 'new', entity: head }
  if (segs.length === 2 && segs[1]) return { kind: 'detail', entity: head, id: segs[1] }
  return { kind: 'unknown' }
}

export type LinkPrefetchHandlers = {
  onMouseEnter: () => void
  onFocus: () => void
}

export function useLinkPrefetch(path: string): LinkPrefetchHandlers {
  const queryClient = useQueryClient()
  // Track whether we've already triggered prefetch for this path on this
  // hook instance — keeps repeated hovers from re-entering the work.
  const triggered = useRef<string | null>(null)

  const prefetch = useCallback(() => {
    if (triggered.current === path) return
    triggered.current = path

    const parsed = parsePrefetchPath(path)
    if (parsed.kind === 'unknown') return

    const spec = SPECS[parsed.entity]
    // Kick the chunk import — fire-and-forget; the browser caches the JS.
    if (parsed.kind === 'detail') {
      void spec.importDetail()
      void queryClient.prefetchQuery({
        queryKey: spec.keyFor(parsed.id),
        queryFn: () => spec.fetch(parsed.id),
        staleTime: 30_000,
      })
    } else if (parsed.kind === 'list') {
      void spec.importList()
    } else if (parsed.kind === 'new') {
      void spec.importNew()
    }
  }, [path, queryClient])

  return { onMouseEnter: prefetch, onFocus: prefetch }
}
