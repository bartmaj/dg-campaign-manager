import { useQuery } from '@tanstack/react-query'
import { getScenario, listScenarios, type ScenarioRow } from '../api/scenarios'

export const scenarioKeys = {
  all: ['scenarios'] as const,
  lists: () => [...scenarioKeys.all, 'list'] as const,
  list: () => [...scenarioKeys.lists()] as const,
  detail: (id: string) => [...scenarioKeys.all, 'detail', id] as const,
}

export function useScenarios() {
  return useQuery<ScenarioRow[]>({
    queryKey: scenarioKeys.list(),
    queryFn: listScenarios,
  })
}

export function useScenario(id: string | undefined) {
  return useQuery<ScenarioRow>({
    queryKey: scenarioKeys.detail(id ?? ''),
    queryFn: () => getScenario(id as string),
    enabled: Boolean(id),
  })
}
