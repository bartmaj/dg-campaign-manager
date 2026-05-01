import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, desc, eq, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { ENTITY_TYPES, type EntityType } from '../../db/schema'
import { edgeInputSchema } from '../../domain/edges'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function asEntityType(value: string | undefined): EntityType | undefined {
  if (!value) return undefined
  return (ENTITY_TYPES as readonly string[]).includes(value) ? (value as EntityType) : undefined
}

/**
 * GET  /api/edges — filtered list of edges. Filters: sourceType, sourceId,
 *                   targetType, targetId, kind. Any combination accepted.
 *                   Returns [] if no filters are supplied (avoids dumping
 *                   the full edge table).
 * POST /api/edges — create a typed edge. Body validated by edgeInputSchema;
 *                   triples not in the EDGE_RULES allowlist return 400.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const sourceType = asEntityType(
      singleParam(req.query.sourceType as string | string[] | undefined),
    )
    const sourceId = singleParam(req.query.sourceId as string | string[] | undefined)
    const targetType = asEntityType(
      singleParam(req.query.targetType as string | string[] | undefined),
    )
    const targetId = singleParam(req.query.targetId as string | string[] | undefined)
    const kind = singleParam(req.query.kind as string | string[] | undefined)

    const conditions: SQL[] = []
    if (sourceType) conditions.push(eq(schema.edges.sourceType, sourceType))
    if (sourceId) conditions.push(eq(schema.edges.sourceId, sourceId))
    if (targetType) conditions.push(eq(schema.edges.targetType, targetType))
    if (targetId) conditions.push(eq(schema.edges.targetId, targetId))
    if (kind) conditions.push(eq(schema.edges.kind, kind))

    if (conditions.length === 0) {
      return res.status(200).json([])
    }

    const rows = await db
      .select()
      .from(schema.edges)
      .where(and(...conditions))
      .orderBy(desc(schema.edges.createdAt))
      .limit(500)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = edgeInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid edge input', issues: parsed.error.issues })
    }
    const input = parsed.data

    const [row] = await db
      .insert(schema.edges)
      .values({
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        targetType: input.targetType,
        targetId: input.targetId,
        kind: input.kind,
        notes: input.notes ?? null,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
