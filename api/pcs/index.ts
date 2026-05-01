import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { deriveAttributes, pcInputSchema } from '../../domain/pc'

/**
 * GET  /api/pcs        — list PCs (most recent first)
 * POST /api/pcs        — create a PC; derived attrs recomputed server-side
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await db.select().from(schema.pcs).orderBy(desc(schema.pcs.createdAt)).limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
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

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
