import { useParams } from 'react-router'
import type { EntityConfig } from '../entities'

type Variant = 'list' | 'new' | 'detail'

const variantLabel: Record<Variant, string> = {
  list: 'List',
  new: 'Create',
  detail: 'Detail',
}

type Props = {
  entity: EntityConfig
  variant: Variant
}

function EntityStubPage({ entity, variant }: Props) {
  const params = useParams()
  const heading =
    variant === 'detail'
      ? `${entity.singular} · ${params.id ?? '?'}`
      : variant === 'new'
        ? `New ${entity.singular}`
        : entity.label

  return (
    <section>
      <h1>{heading}</h1>
      <p>
        {variantLabel[variant]} view for <strong>{entity.label}</strong>. Full UI lands in{' '}
        <code>{entity.futureIssue}</code>.
      </p>
    </section>
  )
}

export default EntityStubPage
