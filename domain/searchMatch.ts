/**
 * In-memory fuzzy matcher for the Cmd-K palette.
 *
 * Per ADR-003, search runs on the SPA — there is no server-side search
 * service. This module is a tiny pure function shaped to one job:
 * filter and rank a `SearchIndexItem[]` by user query.
 *
 * Algorithm (kept simple):
 *
 *   1. Case-insensitive comparison.
 *   2. Try a contiguous substring match first. The score depends on
 *      whether the substring lands at a word boundary (prefix), at the
 *      start of the name, or simply somewhere inside it.
 *   3. If no substring match, try a subsequence match where each
 *      query character must appear in order. Contiguous runs in the
 *      match earn a bonus; gaps incur a small penalty.
 *   4. Stable sort by score desc, then by `name` asc.
 *
 * Performance contract: must filter 1,000 items with a 3-character
 * query in well under one second on commodity hardware (REQ-N01). The
 * perf assertion in the test asserts <200ms locally.
 */

import type { EntityType } from '../db/schema'

export type SearchIndexItem = {
  id: string
  type: EntityType
  name: string
  subtitle?: string
}

export type SearchMatchResult = SearchIndexItem & {
  score: number
  matchedRanges: Array<[number, number]>
}

export type SearchMatchOptions = {
  limit?: number
}

const SCORE_NAME_PREFIX = 1000
const SCORE_WORD_PREFIX = 700
const SCORE_SUBSTRING = 400
const SCORE_SUBSEQUENCE = 100
const CONTIGUOUS_BONUS = 8
const GAP_PENALTY = 1

export function searchMatch(
  query: string,
  items: ReadonlyArray<SearchIndexItem>,
  opts: SearchMatchOptions = {},
): SearchMatchResult[] {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return []

  const out: SearchMatchResult[] = []
  for (const item of items) {
    const scored = scoreItem(q, item)
    if (scored) out.push(scored)
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.name.localeCompare(b.name)
  })

  if (opts.limit !== undefined && opts.limit < out.length) {
    return out.slice(0, opts.limit)
  }
  return out
}

function scoreItem(q: string, item: SearchIndexItem): SearchMatchResult | null {
  const name = item.name
  const lower = name.toLowerCase()

  // 1. Substring match.
  const idx = lower.indexOf(q)
  if (idx !== -1) {
    let base: number
    if (idx === 0) {
      base = SCORE_NAME_PREFIX
    } else if (isWordBoundary(lower, idx)) {
      base = SCORE_WORD_PREFIX
    } else {
      base = SCORE_SUBSTRING
    }
    // Shorter names matching the query are ranked higher.
    const lengthBoost = Math.max(0, 50 - name.length)
    return {
      ...item,
      score: base + lengthBoost,
      matchedRanges: [[idx, idx + q.length]],
    }
  }

  // 2. Subsequence match.
  const sub = subsequenceMatch(q, lower)
  if (!sub) return null

  return {
    ...item,
    score: SCORE_SUBSEQUENCE + sub.bonus,
    matchedRanges: sub.ranges,
  }
}

/**
 * `aBC` matches `apple Banana Cherry` as a subsequence. We track each
 * character's index in `name` and merge consecutive indices into a
 * single `[start, end)` range for highlighting. Contiguous runs earn
 * a bonus; gaps cost.
 */
function subsequenceMatch(
  q: string,
  lowerName: string,
): { bonus: number; ranges: Array<[number, number]> } | null {
  const ranges: Array<[number, number]> = []
  let qi = 0
  let lastIdx = -1
  let bonus = 0

  for (let i = 0; i < lowerName.length && qi < q.length; i++) {
    if (lowerName[i] === q[qi]) {
      if (lastIdx === i - 1 && ranges.length > 0) {
        // Extend previous range; reward contiguity.
        const last = ranges[ranges.length - 1]!
        last[1] = i + 1
        bonus += CONTIGUOUS_BONUS
      } else {
        ranges.push([i, i + 1])
        if (lastIdx !== -1) {
          bonus -= GAP_PENALTY * (i - lastIdx - 1)
        }
      }
      lastIdx = i
      qi++
    }
  }

  if (qi < q.length) return null
  return { bonus, ranges }
}

function isWordBoundary(lower: string, idx: number): boolean {
  if (idx === 0) return true
  const prev = lower[idx - 1]!
  return !/[a-z0-9]/.test(prev)
}
