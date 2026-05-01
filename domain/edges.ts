/**
 * Pure-TS Edge domain module (#009).
 *
 * Polymorphic typed edges (ADR-002) — relationships between any two
 * entities are represented as a single row in the `edges` table with
 * (sourceType, sourceId, kind, targetType, targetId). Referential
 * integrity and the kind allowlist are enforced at the application
 * layer, not the DB.
 *
 * The full reverse-ref UI for edges arrives in #018; this module is the
 * foundation: a typed allowlist plus a Zod schema used by the API to
 * reject invalid triples.
 */
import { z } from 'zod'
import { ENTITY_TYPES, type EntityType } from '../db/schema'

export type EdgeRule = {
  source: EntityType
  kind: string
  target: EntityType
  description: string
}

/**
 * Canonical allowlist of valid (source, kind, target) triples. Extend
 * here when new typed relationships are introduced — the API rejects
 * anything not present.
 *
 * Kept readonly so callers can't accidentally mutate the allowlist.
 */
export const EDGE_RULES = [
  // ─── Clue edges (clues are the connective tissue of an investigation) ───
  {
    source: 'clue',
    kind: 'mentions',
    target: 'npc',
    description: 'Clue text mentions or references an NPC.',
  },
  {
    source: 'clue',
    kind: 'implicates',
    target: 'faction',
    description: 'Clue points to a faction as suspect / responsible.',
  },
  {
    source: 'clue',
    kind: 'points_to',
    target: 'location',
    description: 'Clue directs the investigators toward a location.',
  },
  {
    source: 'clue',
    kind: 'delivered_in',
    target: 'scene',
    description:
      'Clue is intended to be (or was) delivered in this scene. Full delivery-state mechanics: #025.',
  },
  {
    source: 'clue',
    kind: 'prerequisite_of',
    target: 'clue',
    description: 'Investigators need this clue before the target clue is meaningful.',
  },

  // ─── NPC edges ──────────────────────────────────────────────────────────
  {
    source: 'npc',
    kind: 'knows',
    target: 'npc',
    description: 'NPC has a known acquaintance with another NPC.',
  },
  {
    source: 'npc',
    kind: 'enemy_of',
    target: 'npc',
    description: 'NPC is hostile toward another NPC.',
  },
  {
    source: 'npc',
    kind: 'occupies',
    target: 'location',
    description: 'NPC primarily lives at or operates from this location.',
  },
  {
    source: 'npc',
    kind: 'frequents',
    target: 'location',
    description: 'NPC visits this location often but is not based there.',
  },
  {
    source: 'npc',
    kind: 'member_of',
    target: 'faction',
    description: 'NPC is a member or affiliate of the faction.',
  },

  // ─── Item edges ─────────────────────────────────────────────────────────
  {
    source: 'item',
    kind: 'owned_by',
    target: 'npc',
    description: 'Item is currently owned by this NPC.',
  },
  {
    source: 'item',
    kind: 'located_at',
    target: 'location',
    description: 'Item is currently at this location.',
  },

  // ─── PC edges ───────────────────────────────────────────────────────────
  {
    source: 'pc',
    kind: 'bond_with',
    target: 'npc',
    description: 'PC has a Bond (DG RAW) with this NPC.',
  },

  // ─── Faction edges ──────────────────────────────────────────────────────
  {
    source: 'faction',
    kind: 'allied_with',
    target: 'faction',
    description: 'Faction is allied with another faction.',
  },
  {
    source: 'faction',
    kind: 'rival_of',
    target: 'faction',
    description: 'Faction is in rivalry / opposition with another faction.',
  },

  // ─── Session edges ──────────────────────────────────────────────────────
  {
    source: 'session',
    kind: 'runs_through',
    target: 'scenario',
    description: 'Session ran (in part or wholly) through this scenario.',
  },
] as const satisfies ReadonlyArray<EdgeRule>

/**
 * Union of all kind strings present in the allowlist. Useful for callers
 * that want a typed kind list (e.g., UI dropdowns).
 */
export type EdgeKind = (typeof EDGE_RULES)[number]['kind']

/**
 * Returns the matching edge rule for a triple, or undefined if the
 * triple is not in the allowlist.
 */
export function getEdgeRule(
  source: EntityType,
  kind: string,
  target: EntityType,
): EdgeRule | undefined {
  return EDGE_RULES.find((r) => r.source === source && r.kind === kind && r.target === target)
}

/**
 * True if (source, kind, target) is a recognised relationship triple.
 */
export function isValidEdge(source: EntityType, kind: string, target: EntityType): boolean {
  return getEdgeRule(source, kind, target) !== undefined
}

/**
 * Returns every valid `kind` for a given (source, target) pair. Handy
 * for populating UI selectors when both ends are already chosen.
 */
export function kindsForSource(source: EntityType, target: EntityType): readonly string[] {
  return EDGE_RULES.filter((r) => r.source === source && r.target === target).map((r) => r.kind)
}

const entityTypeSchema = z.enum(ENTITY_TYPES)

/**
 * Zod schema for the POST /api/edges body. Enforces the allowlist via
 * `.refine()` so the API rejects invalid triples with a 400.
 */
export const edgeInputSchema = z
  .object({
    sourceType: entityTypeSchema,
    sourceId: z.string().min(1, 'sourceId is required'),
    targetType: entityTypeSchema,
    targetId: z.string().min(1, 'targetId is required'),
    kind: z.string().min(1, 'kind is required'),
    notes: z.string().nullable().optional(),
  })
  .refine((v) => isValidEdge(v.sourceType, v.kind, v.targetType), {
    message: 'Invalid (sourceType, kind, targetType) triple — not in EDGE_RULES allowlist.',
    path: ['kind'],
  })

export type EdgeInput = z.infer<typeof edgeInputSchema>
