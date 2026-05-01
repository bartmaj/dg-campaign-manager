import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../../db/client'

/**
 * Narrow PATCH schema covering only the SAN-block list fields. Editing
 * the full PC is its own story; #012 only needs to maintain breaking
 * points, disorders, and adapted-to from the detail page.
 */
const pcSanityListsPatchSchema = z.object({
  breakingPoints: z.array(z.number().int()).optional(),
  sanityDisorders: z.array(z.string().min(1)).optional(),
  adaptedTo: z.array(z.string().min(1)).optional(),
})

/**
 * GET   /api/pcs/:id — fetch a single PC by id.
 * PATCH /api/pcs/:id — partial update of breakingPoints / sanityDisorders
 *                      / adaptedTo. Other fields are out of scope here.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  if (!id) {
    return res.status(400).json({ error: 'Missing id' })
  }

  if (req.method === 'GET') {
    const [row] = await db.select().from(schema.pcs).where(eq(schema.pcs.id, id)).limit(1)
    if (!row) {
      return res.status(404).json({ error: 'PC not found' })
    }
    return res.status(200).json(row)
  }

  if (req.method === 'PATCH') {
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

  res.setHeader('Allow', 'GET, PATCH')
  return res.status(405).json({ error: 'Method not allowed' })
}
