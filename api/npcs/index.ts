import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { npcInputSchema } from '../../domain/npc'
import { deriveAttributes } from '../../domain/pc'

/**
 * GET  /api/npcs        — list NPCs (most recently updated first)
 * POST /api/npcs        — create an NPC; HP/WP derived from full stats
 *                         when supplied, written through directly for
 *                         simplified blocks.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await db.select().from(schema.npcs).orderBy(desc(schema.npcs.updatedAt)).limit(200)
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const parsed = npcInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid NPC input', issues: parsed.error.issues })
    }
    const input = parsed.data

    let str: number | null = null
    let con: number | null = null
    let dex: number | null = null
    let intelligence: number | null = null
    let pow: number | null = null
    let cha: number | null = null
    let hp: number | null
    let wp: number | null

    if (input.statBlock.kind === 'full') {
      const s = input.statBlock.stats
      const derived = deriveAttributes(s)
      str = s.str
      con = s.con
      dex = s.dex
      intelligence = s.intelligence
      pow = s.pow
      cha = s.cha
      hp = derived.hp
      wp = derived.wp
    } else {
      hp = input.statBlock.hp
      wp = input.statBlock.wp
    }

    const [row] = await db
      .insert(schema.npcs)
      .values({
        campaignId: input.campaignId,
        name: input.name,
        description: input.description,
        profession: input.profession,
        factionId: input.factionId,
        locationId: input.locationId,
        status: input.status,
        str,
        con,
        dex,
        intelligence,
        pow,
        cha,
        hp,
        wp,
        mannerisms: input.mannerisms,
        voice: input.voice,
        secrets: input.secrets,
        currentGoal: input.currentGoal,
      })
      .returning()
    return res.status(201).json(row)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
