import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ENTITY_TYPES, type EntityType } from '../../db/schema'
import { fetchNamesForType } from '../_lib/export'

/**
 * GET /api/search/names?type=<entityType>&ids=<comma-separated>
 *
 * Batched name resolution for any entity type. Returns
 * `{ items: { id, name }[] }`. Used by the EntityRelationships
 * component to render related-entity names with id-fallback while
 * loading. Bonds and campaigns return [] (not in the names map).
 */
export async function namesLookup(req: VercelRequest, res: VercelResponse) {
  const typeParam = req.query.type
  const idsParam = req.query.ids
  const type = (Array.isArray(typeParam) ? typeParam[0] : typeParam) ?? ''
  const idsRaw = (Array.isArray(idsParam) ? idsParam[0] : idsParam) ?? ''

  if (!ENTITY_TYPES.includes(type as EntityType)) {
    return res.status(400).json({ error: 'Invalid type', allowed: ENTITY_TYPES })
  }
  const ids = idsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (ids.length === 0) {
    return res.status(200).json({ items: [] })
  }

  const rows = await fetchNamesForType(type as EntityType, ids)
  return res.status(200).json({ items: rows })
}
