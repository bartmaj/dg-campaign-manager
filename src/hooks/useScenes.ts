import { useQuery } from '@tanstack/react-query'
import { getScene, listScenes, type SceneFilter, type SceneRow } from '../api/scenes'

/**
 * The list-key accepts either a bare scenarioId string (legacy callers
 * inside ScenarioDetailPage) or a SceneFilter object (new callers).
 * Both shapes are normalized to a stable key.
 */
function normalizeFilter(arg: SceneFilter | string | undefined): SceneFilter {
  if (arg === undefined) return {}
  if (typeof arg === 'string') return { scenarioId: arg }
  return arg
}

export const sceneKeys = {
  all: ['scenes'] as const,
  lists: () => [...sceneKeys.all, 'list'] as const,
  list: (arg?: SceneFilter | string) => [...sceneKeys.lists(), normalizeFilter(arg)] as const,
  detail: (id: string) => [...sceneKeys.all, 'detail', id] as const,
}

export function useScenes(arg?: SceneFilter | string) {
  const filter = normalizeFilter(arg)
  return useQuery<SceneRow[]>({
    queryKey: sceneKeys.list(arg),
    queryFn: () => listScenes(filter),
  })
}

export function useScene(id: string | undefined) {
  return useQuery<SceneRow>({
    queryKey: sceneKeys.detail(id ?? ''),
    queryFn: () => getScene(id as string),
    enabled: Boolean(id),
  })
}
