// PageFallback — Suspense fallback for lazy-loaded route chunks.
// Tight, low-noise: a Card with a small Heading. No spinner.
import Card from './Card'
import Heading from './Heading'

function PageFallback() {
  return (
    <Card>
      <Heading level={2}>Loading…</Heading>
    </Card>
  )
}

export default PageFallback
