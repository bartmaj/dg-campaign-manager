import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, desc, eq, like, type SQL } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { clueInputSchema } from '../../domain/clue'
import { serializeEntity } from '../../domain/mdExport'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function cluesList(req: VercelRequest, res: VercelResponse) {
  const originScenarioId = singleParam(req.query.originScenarioId as string | string[] | undefined)
  const q = singleParam(req.query.q as string | string[] | undefined)

  const conditions: SQL[] = []
  if (originScenarioId) conditions.push(eq(schema.clues.originScenarioId, originScenarioId))
  if (q && q.trim().length > 0) conditions.push(like(schema.clues.name, `%${q.trim()}%`))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const rows = await db
    .select()
    .from(schema.clues)
    .where(where)
    .orderBy(desc(schema.clues.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function cluesCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = clueInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid clue input', issues: parsed.error.issues })
  }
  const input = parsed.data

  const [row] = await db
    .insert(schema.clues)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      originScenarioId: input.originScenarioId,
    })
    .returning()
  return res.status(201).json(row)
}

export async function clueGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.clues).where(eq(schema.clues.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Clue not found' })
  }
  return res.status(200).json(row)
}

export async function clueExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [clue] = await db.select().from(schema.clues).where(eq(schema.clues.id, id)).limit(1)
  if (!clue) return res.status(404).json({ error: 'Clue not found' })

  const edgeCtx = await loadEdgeContext('clue', id)
  const extraNames: Record<string, string> = {}
  if (clue.originScenarioId) {
    const [s] = await db
      .select({ id: schema.scenarios.id, name: schema.scenarios.name })
      .from(schema.scenarios)
      .where(eq(schema.scenarios.id, clue.originScenarioId))
      .limit(1)
    if (s) extraNames[s.id] = s.name
  }

  const md = serializeEntity({
    kind: 'clue',
    clue: {
      id: clue.id,
      name: clue.name,
      description: clue.description,
      originScenarioId: clue.originScenarioId,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: { ...edgeCtx.entityNameById, ...extraNames },
  })

  return sendMarkdown(res, md, exportFilename('clue', clue.name))
}
