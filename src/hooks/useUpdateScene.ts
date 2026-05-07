import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateScene, type ScenePatch, type SceneRow } from '../api/scenes'
import { sceneKeys } from './useScenes'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: ScenePatch }

export function useUpdateScene() {
  const qc = useQueryClient()
  return useMutation<SceneRow, Error, Args>({
    mutationFn: ({ id, patch }) => updateScene(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(sceneKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: sceneKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
