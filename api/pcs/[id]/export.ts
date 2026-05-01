import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, eq } from 'drizzle-orm'
import { db, schema } from '../../../db/client'
import { serializeEntity } from '../../../domain/mdExport'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../../_lib/export'

/**
 * GET /api/pcs/:id/export — deterministic Markdown export of one PC,
 * including bonds (with damage events), SAN events, and outgoing /
 * incoming edges. See domain/mdExport.ts for the format contract.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) return res.status(400).json({ error: 'Missing id' })

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
