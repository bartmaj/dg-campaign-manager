// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { SKILL_PACKAGES, applySkillPackage, getSkillPackage } from './skillPackages'

describe('SKILL_PACKAGES', () => {
  it('is non-empty', () => {
    expect(SKILL_PACKAGES.length).toBeGreaterThan(0)
  })

  it('includes Federal Agent with a non-empty skill list and bonusPoints > 0', () => {
    const fed = SKILL_PACKAGES.find((p) => p.profession === 'Federal Agent')
    expect(fed).toBeDefined()
    expect(fed!.skills.length).toBeGreaterThan(0)
    expect(fed!.bonusPoints).toBeGreaterThan(0)
  })

  it('every package has skills.length > 0', () => {
    for (const pkg of SKILL_PACKAGES) {
      expect(pkg.skills.length).toBeGreaterThan(0)
    }
  })
})

describe('getSkillPackage', () => {
  it('returns the right object for a known profession', () => {
    const pkg = getSkillPackage('Federal Agent')
    expect(pkg).toBeDefined()
    expect(pkg!.profession).toBe('Federal Agent')
  })

  it('returns undefined for an unknown profession', () => {
    expect(getSkillPackage('Time Traveler')).toBeUndefined()
  })
})

describe('applySkillPackage', () => {
  it('returns skills with ratings copied from the package', () => {
    const pkg = getSkillPackage('Federal Agent')
    expect(pkg).toBeDefined()
    if (!pkg) return
    const applied = applySkillPackage('Federal Agent')
    expect(applied.length).toBe(pkg.skills.length)
    for (const skill of pkg.skills) {
      const found = applied.find((s) => s.name === skill.name)
      expect(found).toBeDefined()
      expect(found?.rating).toBe(skill.rating)
    }
  })

  it('returns a fresh array — mutating the result does not mutate SKILL_PACKAGES', () => {
    const pkgBefore = getSkillPackage('Federal Agent')
    expect(pkgBefore).toBeDefined()
    if (!pkgBefore) return
    const before = pkgBefore.skills.map((s) => ({ ...s }))
    const applied = applySkillPackage('Federal Agent')
    if (applied[0]) applied[0].rating = 1
    applied.push({ name: 'Made-up Skill', rating: 99 })
    const pkgAfter = getSkillPackage('Federal Agent')
    expect(pkgAfter).toBeDefined()
    if (!pkgAfter) return
    expect(pkgAfter.skills.length).toBe(before.length)
    expect(pkgAfter.skills[0]?.rating).toBe(before[0]?.rating)
  })

  it('returns an empty array for an unknown profession', () => {
    expect(applySkillPackage('Time Traveler')).toEqual([])
  })
})
