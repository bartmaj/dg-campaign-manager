import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { serializeEntity } from '../../domain/mdExport'
import { scenarioInputSchema } from '../../domain/scenario'
import { exportFilename, loadEdgeContext, sendMarkdown, toExportEdges } from '../_lib/export'

export async function scenariosList(_req: VercelRequest, res: VercelResponse) {
  const rows = await db
    .select()
    .from(schema.scenarios)
    .orderBy(desc(schema.scenarios.updatedAt))
    .limit(200)
  return res.status(200).json(rows)
}

export async function scenariosCreate(req: VercelRequest, res: VercelResponse) {
  const parsed = scenarioInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid scenario input', issues: parsed.error.issues })
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
    .insert(schema.scenarios)
    .values({
      campaignId,
      name: input.name,
      description: input.description,
    })
    .returning()
  return res.status(201).json(row)
}

export async function scenarioGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const [row] = await db.select().from(schema.scenarios).where(eq(schema.scenarios.id, id)).limit(1)
  if (!row) return res.status(404).json({ error: 'Scenario not found' })
  return res.status(200).json(row)
}

export async function scenarioExport(_req: VercelRequest, res: VercelResponse, id: string) {
  const [scenario] = await db
    .select()
    .from(schema.scenarios)
    .where(eq(schema.scenarios.id, id))
    .limit(1)
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' })

  const edgeCtx = await loadEdgeContext('scenario', id)

  const md = serializeEntity({
    kind: 'scenario',
    scenario: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
    },
    outgoingEdges: toExportEdges(edgeCtx.outgoing),
    entityNameById: edgeCtx.entityNameById,
  })

  return sendMarkdown(res, md, exportFilename('scenario', scenario.name))
}
