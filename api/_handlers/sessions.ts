import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc, eq, like } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { serializeEntity } from '../../domain/mdExport'
import { sessionInputSchema } from '../../domain/session'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

export async function sessionsList(req: VercelRequest, res: VercelResponse) {
  const orderByParam = req.query.orderBy
  const orderBy = Array.isArray(orderByParam) ? orderByParam[0] : orderByParam
  const useInGame = orderBy === 'inGame'

  const qParam = req.query.q
  const q = Array.isArray(qParam) ? qParam[0] : qParam
  const where = q && q.trim().length > 0 ? like(schema.sessions.name, `%${q.trim()}%`) : undefined

  const rows = await db
    .select()
    .from(schema.sessions)
    .where(where)
    .orderBy(desc(schema.sessions.updatedAt))
    .limit(500)

  const sorted = [...rows].sort((a, b) => {
    const ka = useInGame ? a.inGameDate : a.realWorldDate
    const kb = useInGame ? b.inGameDate : b.realWorldDate
    const ta =
      ka === null || ka === undefined
        ? null
        : ka instanceof Date
          ? ka.getTime()
          : Date.parse(ka as string)
    const tb =
      kb === null || kb === undefined
        ? null
        : kb instanceof Date
          ? kb.getTime()
          : Date.parse(kb as string)
    if (ta === null && tb === null) return 0
    if (ta === null || Number.isNaN(ta)) return 1
    if (tb === null || Number.isNaN(tb)) return -1
    return ta - tb
  })

  return res.status(200).json(sorted)
}

export async function sessionsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = sessionInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid session input', issues: parsed.error.issues })
  }
  const input = parsed.data

  let campaignId = input.campaignId
  if (!campaignId) {
    const [existing] = await db
      .select()
      .from(schema.campaigns)
      .orderBy(asc(schema.campaigns.createdAt))
      .limit(1)
    if (existing) {
      campaignId = existing.id
    } else {
      const inserted = await db
        .insert(schema.campaigns)
        .values({ name: 'Default Campaign', description: null })
        .returning()
      const created = inserted[0]
      if (!created) {
        return res.status(500).json({ error: 'Failed to auto-create default campaign' })
      }
      campaignId = created.id
    }
  }

  const [row] = await db
    .insert(schema.sessions)
    .values({
      campaignId,
      name: input.name,
      description: input.description,
      inGameDate: input.inGameDate,
      inGameDateEnd: input.inGameDateEnd,
      realWorldDate: input.realWorldDate,
    })
    .returning()
  return res.status(201).json(row)
}

export async function sessionGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Session not found' })
  }
  return res.status(200).json(row)
}

export async function sessionExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, id))
    .limit(1)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const edgeCtx = await loadEdgeContext('session', id)

  const md = serializeEntity({
    kind: 'session',
    session: {
      id: session.id,
      name: session.name,
      description: session.description,
      inGameDate: session.inGameDate,
      inGameDateEnd: session.inGameDateEnd,
      realWorldDate:
        session.realWorldDate instanceof Date
          ? session.realWorldDate.toISOString()
          : (session.realWorldDate ?? null),
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: edgeCtx.entityNameById,
  })

  return sendMarkdown(res, md, exportFilename('session', session.name))
}
