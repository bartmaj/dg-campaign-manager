import Field from '../ui/Field'
import Input from '../ui/Input'
import Select from '../ui/Select'

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

/**
 * Renders a row of filter controls. Stateless — owner holds the filter
 * values and re-renders on change. Uses Field for labels and Input/Select
 * primitives for controls.
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
    <div role="group" aria-label="Filters" className="flex flex-row flex-wrap items-end gap-3 my-2">
      {fields.map((field) => {
        if (field.type === 'text') {
          return (
            <div key={field.id} className="min-w-[10rem]">
              <Field label={field.label}>
                <Input
                  type="text"
                  value={values[field.id] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => update(field.id, e.target.value)}
                />
              </Field>
            </div>
          )
        }
        return (
          <div key={field.id} className="min-w-[10rem]">
            <Field label={field.label}>
              <Select
                value={values[field.id] ?? ''}
                onChange={(e) => update(field.id, e.target.value)}
              >
                <option value="">{field.placeholder ?? 'Any'}</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )
      })}
    </div>
  )
}

export default FilterBar
