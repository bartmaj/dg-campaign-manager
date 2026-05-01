import type { VercelRequest, VercelResponse } from '@vercel/node'
import { bondDamageApply, bondDelete, bondGet, bondsCreate, bondsList } from './_handlers/bonds'
import { clueExport, clueGet, cluesCreate, cluesList } from './_handlers/clues'
import { edgeDelete, edgeGet, edgesCreate, edgesList } from './_handlers/edges'
import { factionExport, factionGet, factionsCreate, factionsList } from './_handlers/factions'
import { importScenario } from './_handlers/import'
import { itemExport, itemGet, itemsCreate, itemsList } from './_handlers/items'
import { locationExport, locationGet, locationsCreate, locationsList } from './_handlers/locations'
import { npcExport, npcGet, npcsCreate, npcsList } from './_handlers/npcs'
import {
  pcExport,
  pcGet,
  pcPatch,
  pcsCreate,
  pcsList,
  pcSanityApply,
  pcSanityEvents,
} from './_handlers/pcs'
import { scenarioExport, scenarioGet, scenariosCreate, scenariosList } from './_handlers/scenarios'
import { sceneExport, sceneGet, scenesCreate, scenesList } from './_handlers/scenes'
import { searchIndex } from './_handlers/search'
import { sessionExport, sessionGet, sessionsCreate, sessionsList } from './_handlers/sessions'

type Handler0 = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>
type Handler1 = (req: VercelRequest, res: VercelResponse, id: string) => unknown | Promise<unknown>

type Route =
  | { method: string; pattern: string[]; handler: Handler0; arity: 0 }
  | { method: string; pattern: string[]; handler: Handler1; arity: 1; idParam: string }

/**
 * Pattern segments use `:id` for placeholders. The router supports a single
 * positional id captured under `idParam` (the entity id), which is the only
 * parameter shape used by the existing routes.
 */
function r0(method: string, pattern: string, handler: Handler0): Route {
  return { method, pattern: pattern.split('/').filter(Boolean), handler, arity: 0 }
}
function r1(method: string, pattern: string, handler: Handler1, idParam = 'id'): Route {
  return { method, pattern: pattern.split('/').filter(Boolean), handler, arity: 1, idParam }
}

const routes: Route[] = [
  // pcs
  r0('GET', '/pcs', pcsList),
  r0('POST', '/pcs', pcsCreate),
  r1('GET', '/pcs/:id', pcGet),
  r1('PATCH', '/pcs/:id', pcPatch),
  r1('GET', '/pcs/:id/export', pcExport),
  r1('POST', '/pcs/:id/sanity', pcSanityApply),
  r1('GET', '/pcs/:id/sanity-events', pcSanityEvents),

  // npcs
  r0('GET', '/npcs', npcsList),
  r0('POST', '/npcs', npcsCreate),
  r1('GET', '/npcs/:id', npcGet),
  r1('GET', '/npcs/:id/export', npcExport),

  // clues
  r0('GET', '/clues', cluesList),
  r0('POST', '/clues', cluesCreate),
  r1('GET', '/clues/:id', clueGet),
  r1('GET', '/clues/:id/export', clueExport),

  // factions
  r0('GET', '/factions', factionsList),
  r0('POST', '/factions', factionsCreate),
  r1('GET', '/factions/:id', factionGet),
  r1('GET', '/factions/:id/export', factionExport),

  // locations
  r0('GET', '/locations', locationsList),
  r0('POST', '/locations', locationsCreate),
  r1('GET', '/locations/:id', locationGet),
  r1('GET', '/locations/:id/export', locationExport),

  // items
  r0('GET', '/items', itemsList),
  r0('POST', '/items', itemsCreate),
  r1('GET', '/items/:id', itemGet),
  r1('GET', '/items/:id/export', itemExport),

  // sessions
  r0('GET', '/sessions', sessionsList),
  r0('POST', '/sessions', sessionsCreate),
  r1('GET', '/sessions/:id', sessionGet),
  r1('GET', '/sessions/:id/export', sessionExport),

  // scenarios
  r0('GET', '/scenarios', scenariosList),
  r0('POST', '/scenarios', scenariosCreate),
  r1('GET', '/scenarios/:id', scenarioGet),
  r1('GET', '/scenarios/:id/export', scenarioExport),

  // scenes
  r0('GET', '/scenes', scenesList),
  r0('POST', '/scenes', scenesCreate),
  r1('GET', '/scenes/:id', sceneGet),
  r1('GET', '/scenes/:id/export', sceneExport),

  // bonds
  r0('GET', '/bonds', bondsList),
  r0('POST', '/bonds', bondsCreate),
  r1('GET', '/bonds/:id', bondGet),
  r1('DELETE', '/bonds/:id', bondDelete),
  r1('POST', '/bonds/:id/damage', bondDamageApply),

  // edges
  r0('GET', '/edges', edgesList),
  r0('POST', '/edges', edgesCreate),
  r1('GET', '/edges/:id', edgeGet),
  r1('DELETE', '/edges/:id', edgeDelete),

  // import
  r0('POST', '/import/scenario', importScenario),

  // search
  r0('GET', '/search/index', searchIndex),
]

/**
 * Resolves the request path segments. Vercel populates `req.query.path` as
 * a string array for catch-all routes, but we also fall back to parsing
 * `req.url` for safety (e.g. local dev or unexpected runtime shapes). Path
 * params (UUIDs, slugs with dashes, etc.) flow through unmodified.
 */
function getPathSegments(req: VercelRequest): string[] {
  const q = req.query.path
  if (Array.isArray(q)) return q
  if (typeof q === 'string' && q.length > 0) return q.split('/').filter(Boolean)
  // Fallback: parse `req.url`. Strip query string and a leading `/api`.
  const url = req.url ?? ''
  const pathOnly = url.split('?')[0] ?? ''
  const trimmed = pathOnly.replace(/^\/+/, '')
  const segs = trimmed.split('/').filter(Boolean)
  if (segs[0] === 'api') segs.shift()
  return segs
}

function matchRoute(method: string, segments: string[]): { route: Route; id?: string } | null {
  for (const route of routes) {
    if (route.method !== method) continue
    if (route.pattern.length !== segments.length) continue
    let id: string | undefined
    let ok = true
    for (let i = 0; i < route.pattern.length; i++) {
      const p = route.pattern[i]!
      const s = segments[i]!
      if (p.startsWith(':')) {
        if (s.length === 0) {
          ok = false
          break
        }
        id = s
      } else if (p !== s) {
        ok = false
        break
      }
    }
    if (ok) return { route, id }
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = getPathSegments(req)
  const method = (req.method ?? 'GET').toUpperCase()

  const match = matchRoute(method, segments)
  if (!match) {
    return res.status(404).json({ error: 'Not found' })
  }

  // Decode the id segment so that any percent-encoded characters in the URL
  // arrive at handlers in raw form (matches the per-route Vercel behavior).
  if (match.route.arity === 1) {
    const rawId = match.id ?? ''
    let id: string
    try {
      id = decodeURIComponent(rawId)
    } catch {
      id = rawId
    }
    return match.route.handler(req, res, id)
  }
  return match.route.handler(req, res)
}
