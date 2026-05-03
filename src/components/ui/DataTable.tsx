// DataTable — typed thin table wrapper. No sortable headers (pages pre-sort).
// No className passthrough — see #033.
import type { ReactNode } from 'react'

export type DataTableColumn<Row> = {
  key: string
  header: ReactNode
  render: (row: Row) => ReactNode
}

type Props<Row> = {
  columns: ReadonlyArray<DataTableColumn<Row>>
  rows: ReadonlyArray<Row>
  getRowKey: (row: Row) => string
}

function DataTable<Row>({ columns, rows, getRowKey }: Props<Row>) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-border last:border-b-0">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 align-top text-ink">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
