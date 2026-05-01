import type { CSSProperties } from 'react'

/**
 * Generic filter-bar config item. Each list page builds its own array of
 * these inline and passes them to <FilterBar>.
 */
export type FilterBarField =
  | {
      id: string
      label: string
      type: 'text'
      placeholder?: string
    }
  | {
      id: string
      label: string
      type: 'select'
      options: Array<{ value: string; label: string }>
      placeholder?: string
    }

export type FilterValues = Record<string, string>

export type FilterBarProps = {
  fields: FilterBarField[]
  values: FilterValues
  onChange: (next: FilterValues) => void
}

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  margin: '0.5rem 0',
}

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
}

/**
 * Renders a row of <input>/<select> filter controls. Stateless — owner
 * holds the filter values and re-renders on change.
 */
function FilterBar({ fields, values, onChange }: FilterBarProps) {
  function update(id: string, value: string): void {
    const next: FilterValues = { ...values }
    if (value === '') {
      delete next[id]
    } else {
      next[id] = value
    }
    onChange(next)
  }

  return (
    <div role="group" aria-label="Filters" style={rowStyle}>
      {fields.map((field) => {
        const inputId = `filter-${field.id}`
        if (field.type === 'text') {
          return (
            <div key={field.id} style={fieldStyle}>
              <label htmlFor={inputId} style={{ fontSize: '0.85rem' }}>
                {field.label}
              </label>
              <input
                id={inputId}
                type="text"
                value={values[field.id] ?? ''}
                placeholder={field.placeholder}
                onChange={(e) => update(field.id, e.target.value)}
              />
            </div>
          )
        }
        return (
          <div key={field.id} style={fieldStyle}>
            <label htmlFor={inputId} style={{ fontSize: '0.85rem' }}>
              {field.label}
            </label>
            <select
              id={inputId}
              value={values[field.id] ?? ''}
              onChange={(e) => update(field.id, e.target.value)}
            >
              <option value="">{field.placeholder ?? 'Any'}</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}

export default FilterBar
