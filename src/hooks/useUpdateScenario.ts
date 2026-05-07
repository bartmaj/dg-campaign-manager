import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateScenario, type ScenarioPatch, type ScenarioRow } from '../api/scenarios'
import { scenarioKeys } from './useScenarios'
import { searchIndexQueryKey } from './useSearchIndex'

type Args = { id: string; patch: ScenarioPatch }

export function useUpdateScenario() {
  const qc = useQueryClient()
  return useMutation<ScenarioRow, Error, Args>({
    mutationFn: ({ id, patch }) => updateScenario(id, patch),
    onSuccess: (row) => {
      qc.setQueryData(scenarioKeys.detail(row.id), row)
      qc.invalidateQueries({ queryKey: scenarioKeys.lists() })
      qc.invalidateQueries({ queryKey: searchIndexQueryKey })
    },
  })
}
