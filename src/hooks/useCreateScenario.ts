import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ScenarioInput } from '../../domain/scenario'
import { createScenario, type ScenarioRow } from '../api/scenarios'
import { scenarioKeys } from './useScenarios'

export function useCreateScenario() {
  const qc = useQueryClient()
  return useMutation<ScenarioRow, Error, ScenarioInput>({
    mutationFn: createScenario,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: scenarioKeys.lists() })
      qc.setQueryData(scenarioKeys.detail(row.id), row)
    },
  })
}
