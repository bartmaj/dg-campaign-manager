import { useMemo, useState } from 'react'
import PrefetchLink from '../../components/ui/PrefetchLink'
import type { SceneFilter, SceneRow } from '../../api/scenes'
import FilterBar, {
  type FilterBarField,
  type FilterValues,
} from '../../components/FilterBar/FilterBar'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useScenarios } from '../../hooks/useScenarios'
import { useScenes } from '../../hooks/useScenes'

function SceneListPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const { data: scenarios } = useScenarios()

  const filter: SceneFilter = useMemo(() => {
    const next: SceneFilter = {}
    if (filterValues.scenarioId) next.scenarioId = filterValues.scenarioId
    if (filterValues.q) next.q = filterValues.q
    return next
  }, [filterValues])

  const { data, isLoading, error } = useScenes(filter)

  const fields: FilterBarField[] = useMemo(
    () => [
      { id: 'q', label: 'Name', type: 'text', placeholder: 'search by name' },
      {
        id: 'scenarioId',
        label: 'Scenario',
        type: 'select',
        options: (scenarios ?? []).map((s) => ({ value: s.id, label: s.name })),
      },
    ],
    [scenarios],
  )

  const columns: ReadonlyArray<DataTableColumn<SceneRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (s) => <PrefetchLink to={`/scenes/${s.id}`}>{s.name}</PrefetchLink>,
    },
    {
      key: 'scenario',
      header: 'Scenario',
      render: (s) => <PrefetchLink to={`/scenarios/${s.scenarioId}`}>{s.scenarioId}</PrefetchLink>,
    },
  ]

  return (
    <Stack gap="md">
      <Toolbar align="between">
        <Heading level={1}>Scenes</Heading>
        <LinkButton to="/scenes/new" variant="primary">
          + New scene
        </LinkButton>
      </Toolbar>
      <FilterBar fields={fields} values={filterValues} onChange={setFilterValues} />
      {isLoading && <p>Loading…</p>}
      {error && <p>Failed to load: {error.message}</p>}
      {data && data.length === 0 && <EmptyState title="No scenes match the current filters." />}
      {data && data.length > 0 && (
        <DataTable columns={columns} rows={data} getRowKey={(s) => s.id} />
      )}
    </Stack>
  )
}

export default SceneListPage
