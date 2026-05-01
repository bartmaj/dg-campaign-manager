import { useQuery } from '@tanstack/react-query'
import { getScenario, listScenarios, type ScenarioFilter, type ScenarioRow } from '../api/scenarios'

export const scenarioKeys = {
  all: ['scenarios'] as const,
  lists: () => [...scenarioKeys.all, 'list'] as const,
  list: (filter?: ScenarioFilter) => [...scenarioKeys.lists(), filter ?? {}] as const,
  detail: (id: string) => [...scenarioKeys.all, 'detail', id] as const,
}

export function useScenarios(filter?: ScenarioFilter) {
  return useQuery<ScenarioRow[]>({
    queryKey: scenarioKeys.list(filter),
    queryFn: () => listScenarios(filter ?? {}),
  })
}

export function useScenario(id: string | undefined) {
  return useQuery<ScenarioRow>({
    queryKey: scenarioKeys.detail(id ?? ''),
    queryFn: () => getScenario(id as string),
    enabled: Boolean(id),
  })
}
