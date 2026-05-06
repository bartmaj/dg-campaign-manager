import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteScenario } from '../api/scenarios'
import { scenarioKeys } from './useScenarios'
import { searchIndexQueryKey } from './useSearchIndex'

export function useDeleteScenario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteScenario(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: scenarioKeys.lists() })
      qc.removeQueries({ queryKey: scenarioKeys.detail(id) })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
