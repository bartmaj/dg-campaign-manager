import type { EntityType } from '../../../db/schema'
import type { SearchIndexItem } from '../../../domain/searchMatch'

/**
 * Map an entity type to its URL prefix. Schema uses singular names
 * (`pc`, `npc`, …); the SPA's routes are plural (`/pcs`, `/npcs`, …).
 *
 * `campaign` and `bond` have no dedicated detail page in M2 — the
 * palette uses `null` here and the result resolver below picks a sensible
 * fallback (bonds redirect to their owning PC's detail page).
 */
export const ENTITY_TYPE_TO_PATH: Record<EntityType, string | null> = {
  campaign: null,
  scenario: '/scenarios',
  scene: '/scenes',
  pc: '/pcs',
  npc: '/npcs',
  clue: '/clues',
  item: '/items',
  faction: '/factions',
  location: '/locations',
  session: '/sessions',
  bond: null,
}

/**
 * Resolve the destination path for a given search result. Bonds don't
 * have a detail page — the GM lands on the bond's owning PC instead.
 */
export function resolveResultPath(item: SearchIndexItem): string | null {
  if (item.type === 'bond') {
    // The subtitle for bonds is "{pcName} → {targetName}" but we don't
    // carry the pcId on the wire. Fall through to /pcs as the closest
    // anchor; the GM can then pick the PC detail page.
    return '/pcs'
  }
  const prefix = ENTITY_TYPE_TO_PATH[item.type]
  if (!prefix) return null
  return `${prefix}/${item.id}`
}

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  campaign: 'Campaign',
  scenario: 'Scenario',
  scene: 'Scene',
  pc: 'PC',
  npc: 'NPC',
  clue: 'Clue',
  item: 'Item',
  faction: 'Faction',
  location: 'Location',
  session: 'Session',
  bond: 'Bond',
}
