/**
 * Cache-Control helpers for read endpoints.
 *
 * `private, max-age=0, must-revalidate` keeps responses cacheable in the
 * browser HTTP cache (so navigation back/forward and React Query
 * prefetch revalidate cheaply) but forbids any shared/edge cache from
 * holding the response — important because the campaign data is
 * GM-private and freshness matters at the table.
 */
import type { VercelResponse } from '@vercel/node'

export function setReadCacheHeaders(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
}
