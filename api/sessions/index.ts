import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { sessionInputSchema } from '../../domain/session'

/**
 * GET  /api/sessions?orderBy=inGame|realWorld — list sessions sorted on the
 *       requested timeline axis (default: realWorld). Sessions with a null
 *       value on the chosen axis sort to the end.
 * POST /api/sessions — create a session. If `campaignId` is omitted, the
 *       handler falls back to the first existing campaign or auto-creates
 *       a "Default Campaign" so session creation is unblocked before the
 *       multi-campaign UI lands (#023).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const orderByParam = req.query.orderBy
    const orderBy = Array.isArray(orderByParam) ? orderByParam[0] : orderByParam
    const useInGame = orderBy === 'inGame'

    // SQLite NULLS LAST: drizzle's `asc`/`desc` follows SQLite default
    // (NULLS FIRST for ASC). We sort in JS after the query so null axis
    // values land at the end on both axes; volume here is small (<200).
    const rows = await db
      .select()
      .from(schema.sessions)
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

  if (req.method === 'POST') {
    const parsed = sessionInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid session input', issues: parsed.error.issues })
    }
    const input = parsed.data

    // Default-campaign handling: until the multi-campaign UI lands (#023),
    // sessions can be created without an explicit campaignId. We pick the
    // first existing campaign or auto-create a "Default Campaign" row.
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

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
