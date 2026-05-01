import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc, eq, like, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../../db/client'
import { serializeEntity } from '../../domain/mdExport'
import { deriveAttributes, pcInputSchema } from '../../domain/pc'
import {
  applySanityChange,
  detectCrossedThresholds,
  sanChangeInputSchema,
} from '../../domain/sanity'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

const pcSanityListsPatchSchema = z.object({
  breakingPoints: z.array(z.number().int()).optional(),
  sanityDisorders: z.array(z.string().min(1)).optional(),
  adaptedTo: z.array(z.string().min(1)).optional(),
})

function singlePcParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function pcsList(req: VercelRequest, res: VercelResponse) {
  const q = singlePcParam(req.query.q as string | string[] | undefined)
  const where = q && q.trim().length > 0 ? like(schema.pcs.name, `%${q.trim()}%`) : undefined

  const rows = await db
    .select()
    .from(schema.pcs)
    .where(where)
    .orderBy(desc(schema.pcs.createdAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function pcsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = pcInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid PC input', issues: parsed.error.issues })
  }
  const input = parsed.data
  const derived = deriveAttributes(input.stats)
  const [row] = await db
    .insert(schema.pcs)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      profession: input.profession,
      str: input.stats.str,
      con: input.stats.con,
      dex: input.stats.dex,
      intelligence: input.stats.intelligence,
      pow: input.stats.pow,
      cha: input.stats.cha,
      hp: derived.hp,
      wp: derived.wp,
      bp: derived.bp,
      sanMax: derived.sanMax,
      skills: input.skills,
      motivations: input.motivations,
      backstoryHooks: input.backstoryHooks,
      sanityCurrent: derived.sanMax,
      sanityDisorders: [],
      breakingPoints: [],
    })
    .returning()
  return res.status(201).json(row)
}

export async function pcGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.pcs).where(eq(schema.pcs.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'PC not found' })
  }
  return res.status(200).json(row)
}

export async function pcPatch(req: VercelRequest, res: VercelResponse, id: string) {
  const parsed = pcSanityListsPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid PC patch input', issues: parsed.error.issues })
  }
  const patch = parsed.data
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Empty patch' })
  }
  const [row] = await db
    .update(schema.pcs)
    .set({ ...patch, updatedAt: sql`(unixepoch())` })
    .where(eq(schema.pcs.id, id))
    .returning()
  if (!row) {
    return res.status(404).json({ error: 'PC not found' })
  }
  return res.status(200).json(row)
}

export async function pcExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [pc] = await db.select().from(schema.pcs).where(eq(schema.pcs.id, id)).limit(1)
  if (!pc) return res.status(404).json({ error: 'PC not found' })

  const [bondRows, sanEvents, edgeCtx] = await Promise.all([
    db.select().from(schema.bonds).where(eq(schema.bonds.pcId, id)),
    db
      .select()
      .from(schema.sanChangeEvents)
      .where(eq(schema.sanChangeEvents.pcId, id))
      .orderBy(asc(schema.sanChangeEvents.appliedAt)),
    loadEdgeContext('pc', id),
  ])

  const bondsWithEvents = await Promise.all(
    bondRows.map(async (bond) => {
      const events = await db
        .select()
        .from(schema.bondDamageEvents)
        .where(eq(schema.bondDamageEvents.bondId, bond.id))
        .orderBy(asc(schema.bondDamageEvents.appliedAt))
      return {
        bond: {
          id: bond.id,
          name: bond.name,
          currentScore: bond.currentScore,
          maxScore: bond.maxScore,
          targetType: bond.targetType as 'npc' | 'pc',
          targetId: bond.targetId,
          description: bond.description,
        },
        events: events.map((ev) => ({
          id: ev.id,
          delta: ev.delta,
          reason: ev.reason,
          sessionId: ev.sessionId,
          appliedAt:
            ev.appliedAt instanceof Date ? ev.appliedAt.toISOString() : String(ev.appliedAt),
        })),
      }
    }),
  )

  const md = serializeEntity({
    kind: 'pc',
    pc: {
      id: pc.id,
      name: pc.name,
      description: pc.description,
      profession: pc.profession,
      str: pc.str,
      con: pc.con,
      dex: pc.dex,
      intelligence: pc.intelligence,
      pow: pc.pow,
      cha: pc.cha,
      hp: pc.hp,
      wp: pc.wp,
      bp: pc.bp,
      sanMax: pc.sanMax,
      skills: pc.skills ?? null,
      motivations: pc.motivations ?? null,
      backstoryHooks: pc.backstoryHooks,
      sanityCurrent: pc.sanityCurrent,
      sanityDisorders: pc.sanityDisorders ?? null,
      breakingPoints: pc.breakingPoints ?? null,
      adaptedTo: pc.adaptedTo ?? null,
    },
    bonds: bondsWithEvents,
    sanEvents: sanEvents.map((ev) => ({
      id: ev.id,
      delta: ev.delta,
      source: ev.source,
      sessionId: ev.sessionId,
      crossedThresholds: ev.crossedThresholds ?? null,
      appliedAt: ev.appliedAt instanceof Date ? ev.appliedAt.toISOString() : String(ev.appliedAt),
    })),
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    incomingEdges: toExportEdges(edgeCtx.incoming),
    entityNameById: edgeCtx.entityNameById,
  })

  return sendMarkdown(res, md, exportFilename('pc', pc.name))
}

export async function pcSanityApply(req: VercelRequest, res: VercelResponse, id: string) {
  const parsed = sanChangeInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid sanity input', issues: parsed.error.issues })
  }
  const input = parsed.data

  try {
    const result = await db.transaction(async (tx) => {
      const [pc] = await tx.select().from(schema.pcs).where(eq(schema.pcs.id, id)).limit(1)
      if (!pc) return null

      const prevSan = pc.sanityCurrent ?? pc.sanMax
      const ceiling = pc.sanMax > 0 ? pc.sanMax : Number.POSITIVE_INFINITY
      const nextSan = applySanityChange(prevSan, input.delta, { ceiling })
      const thresholds = pc.breakingPoints ?? []
      const crossed = detectCrossedThresholds(prevSan, nextSan, thresholds)

      const [event] = await tx
        .insert(schema.sanChangeEvents)
        .values({
          pcId: id,
          delta: input.delta,
          source: input.source,
          sessionId: input.sessionId ?? null,
          crossedThresholds: crossed,
        })
        .returning()

      const [updated] = await tx
        .update(schema.pcs)
        .set({ sanityCurrent: nextSan, updatedAt: sql`(unixepoch())` })
        .where(eq(schema.pcs.id, id))
        .returning()

      return { pc: updated, event, crossedThresholds: crossed }
    })

    if (!result) {
      return res.status(404).json({ error: 'PC not found' })
    }
    return res.status(201).json(result)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

export async function pcSanityEvents(_req: VercelRequest, res: VercelResponse, id: string) {
  const events = await db
    .select()
    .from(schema.sanChangeEvents)
    .where(eq(schema.sanChangeEvents.pcId, id))
    .orderBy(desc(schema.sanChangeEvents.appliedAt))
    .limit(500)

  return res.status(200).json(events)
}
