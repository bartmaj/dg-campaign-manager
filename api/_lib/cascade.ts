import { and, eq, or } from 'drizzle-orm'
import type { EntityType } from '../../db/schema.js'
import { schema } from '../../db/client.js'

type Tx = Parameters<Parameters<typeof import('../../db/client.js').db.transaction>[0]>[0]

/**
 * Deletes every polymorphic edge that has the given entity as either
 * source or target. Called from each entity's DELETE handler inside a
 * libSQL transaction so the entity row + its dangling edges go together
 * — no orphan rows accumulate in the edges table.
 *
 * Per-table FK cascades (bonds → pc, faction_status_events → faction,
 * scenes → scenario, etc.) are handled by the schema's ON DELETE CASCADE.
 * This helper covers only the polymorphic edges table, which has no FK.
 */
export async function deleteEntityEdges(
  tx: Tx,
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  await tx
    .delete(schema.edges)
    .where(
      or(
        and(eq(schema.edges.sourceType, entityType), eq(schema.edges.sourceId, entityId)),
        and(eq(schema.edges.targetType, entityType), eq(schema.edges.targetId, entityId)),
      ),
    )
}
