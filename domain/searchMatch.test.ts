// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { searchMatch, type SearchIndexItem } from './searchMatch'

function item(id: string, name: string, type: SearchIndexItem['type'] = 'npc'): SearchIndexItem {
  return { id, type, name }
}

describe('searchMatch', () => {
  it('returns empty array for empty query', () => {
    const items = [item('1', 'Alice')]
    expect(searchMatch('', items)).toEqual([])
    expect(searchMatch('   ', items)).toEqual([])
  })

  it('matches case-insensitively', () => {
    const items = [item('1', 'Alice'), item('2', 'BORIS')]
    const res = searchMatch('bor', items)
    expect(res.map((r) => r.id)).toEqual(['2'])
    const res2 = searchMatch('ALI', items)
    expect(res2.map((r) => r.id)).toEqual(['1'])
  })

  it('ranks name-prefix above word-prefix above substring', () => {
    const items = [
      item('substr', 'The crab man'),
      item('word', 'Black crabs'),
      item('prefix', 'Crab specialist'),
    ]
    const res = searchMatch('crab', items)
    expect(res.map((r) => r.id)).toEqual(['prefix', 'word', 'substr'])
  })

  it('falls back to subsequence match when no substring exists', () => {
    const items = [item('1', 'Agent Smith')]
    // 'agm' is a subsequence of 'agent smith' (a-g-m).
    const res = searchMatch('agm', items)
    expect(res).toHaveLength(1)
    expect(res[0]!.id).toBe('1')
  })

  it('rewards contiguous matches over gappy ones', () => {
    // Both names match query "abc" only as a subsequence. The contiguous
    // version should outscore the gappy one.
    const items = [
      item('gap', 'Anchor Boris Carmine'), // a…b…c with big gaps
      item('contig', 'Zebra abc fields'), // contains 'abc' contiguously (subseq path: a-b-c at 6,7,8)
    ]
    // 'Zebra abc fields' contains 'abc' as substring at index 6 (word
    // boundary), so it gets the WORD_PREFIX score; the other only matches
    // as a gappy subsequence. The contiguous one must win.
    const res = searchMatch('abc', items)
    expect(res[0]!.id).toBe('contig')
  })

  it('returns matchedRanges for highlighting', () => {
    const items = [item('1', 'Alice Walker')]
    const res = searchMatch('walk', items)
    expect(res[0]!.matchedRanges).toEqual([[6, 10]])
  })

  it('respects the limit option', () => {
    const items = Array.from({ length: 50 }, (_, i) => item(String(i), `Cult member ${i}`))
    const res = searchMatch('cult', items, { limit: 10 })
    expect(res).toHaveLength(10)
  })

  it('produces a stable secondary sort by name when scores tie', () => {
    const items = [item('b', 'Bravo unit'), item('a', 'Alpha unit'), item('c', 'Charlie unit')]
    const res = searchMatch('unit', items)
    expect(res.map((r) => r.name)).toEqual(['Alpha unit', 'Bravo unit', 'Charlie unit'])
  })

  it('filters out non-matches', () => {
    const items = [item('1', 'Alice'), item('2', 'Bob'), item('3', 'Charlie')]
    const res = searchMatch('xyz', items)
    expect(res).toEqual([])
  })

  it('runs under 200ms for 1,000 items with a 3-char query (perf bound)', () => {
    // REQ-N01: <1s for 1,000-entity datasets. We assert a much tighter
    // local bound (200ms) to leave headroom on slower CI machines.
    const names = [
      'Agent Smith',
      'Black Cobra',
      'Cult of the Black Goat',
      'Delta Green',
      'Eldritch Horror',
      'Federal Agent',
      'Gloucester',
      'Hannibal',
      'Innsmouth',
      'Joseph Curwen',
    ]
    const items: SearchIndexItem[] = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i),
      type: 'npc',
      name: `${names[i % names.length]} ${i}`,
    }))
    const start = performance.now()
    const res = searchMatch('cul', items)
    const elapsed = performance.now() - start
    expect(res.length).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(200)
  })
})
