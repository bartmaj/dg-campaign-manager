import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SceneInput } from '../../domain/scene'
import { createScene, type SceneRow } from '../api/scenes'
import { sceneKeys } from './useScenes'
import { searchIndexQueryKey } from './useSearchIndex'

export function useCreateScene() {
  const qc = useQueryClient()
  return useMutation<SceneRow, Error, SceneInput>({
    mutationFn: createScene,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: sceneKeys.lists() })
      qc.setQueryData(sceneKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
