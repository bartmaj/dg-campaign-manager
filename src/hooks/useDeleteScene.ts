import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteScene } from '../api/scenes'
import { sceneKeys } from './useScenes'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteScene() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteScene(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: sceneKeys.lists() })
      qc.removeQueries({ queryKey: sceneKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
