import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, desc, eq, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { BOND_TARGET_TYPES, bondInputSchema, type BondTargetType } from '../../domain/bonds'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function asTargetType(value: string | undefined): BondTargetType | undefined {
  if (!value) return undefined
  return (BOND_TARGET_TYPES as readonly string[]).includes(value)
    ? (value as BondTargetType)
    : undefined
}

/**
 * GET  /api/bonds — list bonds. At least one filter is required:
 *                   - pcId             → bonds owned by a PC
 *                   - targetType+targetId → bonds pointing AT an entity
 *                   Without filters, returns []. Avoids dumping the full table.
 * POST /api/bonds — create a bond. If `currentScore` is omitted it defaults
 *                   to `maxScore`.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const pcId = singleParam(req.query.pcId as string | string[] | undefined)
    const targetType = asTargetType(
      singleParam(req.query.targetType as string | string[] | undefined),
    )
    const targetId = singleParam(req.query.targetId as string | string[] | undefined)

    const conditions: SQL[] = []
    if (pcId) conditions.push(eq(schema.bonds.pcId, pcId))
    if (targetType) conditions.push(eq(schema.bonds.targetType, targetType))
    if (targetId) conditions.push(eq(schema.bonds.targetId, targetId))

    if (conditions.length === 0) {
      return res.status(200).json([])
    }

    const rows = await db
      .select()
      .from(schema.bonds)
      .where(and(...conditions))
      .orderBy(desc(schema.bonds.updatedAt))
      .limit(500)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = bondInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid bond input', issues: parsed.error.issues })
    }
    const input = parsed.data

    const [row] = await db
      .insert(schema.bonds)
      .values({
        pcId: input.pcId,
        name: input.name,
        targetType: input.targetType,
        targetId: input.targetId,
        maxScore: input.maxScore,
        currentScore: input.currentScore ?? input.maxScore,
        description: input.description ?? null,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
