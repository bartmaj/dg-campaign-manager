import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import {
  applyDamage,
  BOND_TARGET_TYPES,
  bondDamageInputSchema,
  bondInputSchema,
  type BondTargetType,
} from '../../domain/bonds'

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

export async function bondsList(req: VercelRequest, res: VercelResponse) {
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

export async function bondsCreate(req: VercelRequest, res: VercelResponse) {
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

export async function bondGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [bond] = await db.select().from(schema.bonds).where(eq(schema.bonds.id, id)).limit(1)
  if (!bond) {
    return res.status(404).json({ error: 'Bond not found' })
  }
  const events = await db
    .select()
    .from(schema.bondDamageEvents)
    .where(eq(schema.bondDamageEvents.bondId, id))
    .orderBy(asc(schema.bondDamageEvents.appliedAt))
  return res.status(200).json({ bond, events })
}

export async function bondDelete(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.delete(schema.bonds).where(eq(schema.bonds.id, id)).returning()
  if (!row) {
    return res.status(404).json({ error: 'Bond not found' })
  }
  return res.status(200).json(row)
}

export async function bondDamageApply(req: VercelRequest, res: VercelResponse, id: string) {
  const parsed = bondDamageInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid damage input', issues: parsed.error.issues })
  }
  const input = parsed.data

  try {
    const result = await db.transaction(async (tx) => {
      const [bond] = await tx.select().from(schema.bonds).where(eq(schema.bonds.id, id)).limit(1)
      if (!bond) return null

      const newScore = applyDamage(bond.currentScore, input.delta)

      const [event] = await tx
        .insert(schema.bondDamageEvents)
        .values({
          bondId: id,
          delta: input.delta,
          reason: input.reason ?? null,
          sessionId: input.sessionId ?? null,
        })
        .returning()

      const [updated] = await tx
        .update(schema.bonds)
        .set({ currentScore: newScore, updatedAt: sql`(unixepoch())` })
        .where(eq(schema.bonds.id, id))
        .returning()

      return { bond: updated, event }
    })

    if (!result) {
      return res.status(404).json({ error: 'Bond not found' })
    }
    return res.status(201).json(result)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}
