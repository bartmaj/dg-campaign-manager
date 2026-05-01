import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc, eq, like } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { factionInputSchema } from '../../domain/faction'
import { serializeEntity } from '../../domain/mdExport'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

function singleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function factionsList(req: VercelRequest, res: VercelResponse) {
  const q = singleParam(req.query.q as string | string[] | undefined)
  const where = q && q.trim().length > 0 ? like(schema.factions.name, `%${q.trim()}%`) : undefined

  const rows = await db
    .select()
    .from(schema.factions)
    .where(where)
    .orderBy(desc(schema.factions.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function factionsCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = factionInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid faction input', issues: parsed.error.issues })
  }
  const input = parsed.data

  const [row] = await db
    .insert(schema.factions)
    .values({
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      agenda: input.agenda,
    })
    .returning()
  return res.status(201).json(row)
}

export async function factionGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.factions).where(eq(schema.factions.id, id)).limit(1)
  if (!row) {
    return res.status(404).json({ error: 'Faction not found' })
  }
  return res.status(200).json(row)
}

export async function factionExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [faction] = await db
    .select()
    .from(schema.factions)
    .where(eq(schema.factions.id, id))
    .limit(1)
  if (!faction) return res.status(404).json({ error: 'Faction not found' })

  const edgeCtx = await loadEdgeContext('faction', id)

  const md = serializeEntity({
    kind: 'faction',
    faction: {
      id: faction.id,
      name: faction.name,
      description: faction.description,
      agenda: faction.agenda,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    incomingEdges: toExportEdges(edgeCtx.incoming),
    entityNameById: edgeCtx.entityNameById,
  })

  return sendMarkdown(res, md, exportFilename('faction', faction.name))
}
