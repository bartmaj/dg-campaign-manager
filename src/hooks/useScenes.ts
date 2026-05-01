import { useQuery } from '@tanstack/react-query'
import { getScene, listScenes, type SceneRow } from '../api/scenes'

export const sceneKeys = {
  all: ['scenes'] as const,
  lists: () => [...sceneKeys.all, 'list'] as const,
  list: (scenarioId: string | undefined) => [...sceneKeys.lists(), scenarioId ?? 'all'] as const,
  detail: (id: string) => [...sceneKeys.all, 'detail', id] as const,
}

export function useScenes(scenarioId?: string) {
  return useQuery<SceneRow[]>({
    queryKey: sceneKeys.list(scenarioId),
    queryFn: () => listScenes(scenarioId),
  })
}

export function useScene(id: string | undefined) {
  return useQuery<SceneRow>({
    queryKey: sceneKeys.detail(id ?? ''),
    queryFn: () => getScene(id as string),
    enabled: Boolean(id),
  })
}
