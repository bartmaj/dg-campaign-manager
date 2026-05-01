/**
 * Pure-TS DG RAW skill-package presets.
 *
 * Source: Delta Green Agent's Handbook (Arc Dream).
 *
 * No DB, no React, no I/O. Provides the canonical 18 Agent's Handbook
 * professions with their skill-package ratings and bonus-point pools.
 *
 * Bonus points are an Agent's Handbook concept: a pool of additional points
 * a player can spend to customize the package. v1 only exposes the pool size
 * so the form can show a hint — actual spending UX is out of scope.
 *
 * NOTE: A handful of canonical ratings (marked with TODO(verify)) are
 * reasonable approximations pending a printed-book cross-check.
 */

/**
 * Master list of skill names referenced anywhere in DG RAW skill packages.
 * Multi-category skills (Craft, Science, Foreign Language) use the
 * "Skill (Specialty)" convention.
 */
export const DG_SKILL_NAMES = [
  'Accounting',
  'Alertness',
  'Anthropology',
  'Archeology',
  'Art',
  'Artillery',
  'Athletics',
  'Bureaucracy',
  'Computer Science',
  'Craft (Electrician)',
  'Craft (Mechanic)',
  'Craft (Microelectronics)',
  'Criminology',
  'Demolitions',
  'Disguise',
  'Dodge',
  'Drive',
  'Firearms',
  'First Aid',
  'Forensics',
  'Foreign Language (Arabic)',
  'Foreign Language (Spanish)',
  'Foreign Language (Russian)',
  'Heavy Machinery',
  'Heavy Weapons',
  'History',
  'HUMINT',
  'Law',
  'Medicine',
  'Melee Weapons',
  'Military Science (Land)',
  'Military Science (Sea)',
  'Navigate',
  'Occult',
  'Persuade',
  'Pharmacy',
  'Pilot (Aircraft)',
  'Pilot (Boat)',
  'Psychotherapy',
  'Ride',
  'Science (Biology)',
  'Science (Chemistry)',
  'Science (Physics)',
  'Search',
  'SIGINT',
  'Stealth',
  'Surgery',
  'Survival',
  'Swim',
  'Unarmed Combat',
] as const

export type DgSkillName = (typeof DG_SKILL_NAMES)[number]

export type SkillPackage = {
  profession: string
  skills: Array<{ name: string; rating: number }>
  /** Bonus point pool the player may spend on package skills. */
  bonusPoints: number
}

// ─── Package data ───────────────────────────────────────────────────────────
// Ratings drawn from Delta Green Agent's Handbook (Arc Dream).
// Where a precise printed value was not at hand, a reasonable RAW-consistent
// rating is used and marked TODO(verify).

export const SKILL_PACKAGES: readonly SkillPackage[] = [
  {
    profession: 'Federal Agent',
    bonusPoints: 10,
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Athletics', rating: 50 },
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Criminology', rating: 50 },
      { name: 'Drive', rating: 50 },
      { name: 'Firearms', rating: 50 },
      { name: 'First Aid', rating: 30 },
      { name: 'Forensics', rating: 30 },
      { name: 'HUMINT', rating: 60 },
      { name: 'Law', rating: 30 },
      { name: 'Persuade', rating: 50 },
      { name: 'Search', rating: 50 },
      { name: 'Unarmed Combat', rating: 60 },
    ],
  },
  {
    profession: 'Special Operator',
    bonusPoints: 8, // TODO(verify)
    skills: [
      { name: 'Alertness', rating: 60 },
      { name: 'Athletics', rating: 60 },
      { name: 'Demolitions', rating: 40 },
      { name: 'Firearms', rating: 60 },
      { name: 'First Aid', rating: 40 },
      { name: 'Heavy Weapons', rating: 50 },
      { name: 'Melee Weapons', rating: 50 },
      { name: 'Military Science (Land)', rating: 60 },
      { name: 'Navigate', rating: 50 },
      { name: 'Stealth', rating: 50 },
      { name: 'Survival', rating: 50 },
      { name: 'Swim', rating: 40 },
      { name: 'Unarmed Combat', rating: 60 },
    ],
  },
  {
    profession: 'Scientist',
    bonusPoints: 8,
    skills: [
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Computer Science', rating: 40 },
      { name: 'Foreign Language (Spanish)', rating: 40 }, // TODO(verify) — player choice
      { name: 'Science (Biology)', rating: 60 },
      { name: 'Science (Chemistry)', rating: 50 },
      { name: 'Science (Physics)', rating: 50 },
    ],
  },
  {
    profession: 'Anthropologist/Historian',
    bonusPoints: 8,
    skills: [
      { name: 'Anthropology', rating: 60 },
      { name: 'Archeology', rating: 50 },
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Foreign Language (Arabic)', rating: 50 }, // TODO(verify) — player choice
      { name: 'Foreign Language (Spanish)', rating: 40 }, // TODO(verify) — player choice
      { name: 'History', rating: 60 },
      { name: 'HUMINT', rating: 40 },
      { name: 'Occult', rating: 40 },
      { name: 'Persuade', rating: 40 },
    ],
  },
  {
    profession: 'Computer Science',
    bonusPoints: 8,
    skills: [
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Computer Science', rating: 70 },
      { name: 'Craft (Microelectronics)', rating: 50 },
      { name: 'Science (Physics)', rating: 40 },
      { name: 'SIGINT', rating: 50 },
    ],
  },
  {
    profession: 'Criminal',
    bonusPoints: 8,
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Athletics', rating: 50 },
      { name: 'Criminology', rating: 60 },
      { name: 'Disguise', rating: 30 },
      { name: 'Dodge', rating: 40 },
      { name: 'Drive', rating: 50 },
      { name: 'Firearms', rating: 40 },
      { name: 'HUMINT', rating: 40 },
      { name: 'Persuade', rating: 50 },
      { name: 'Stealth', rating: 50 },
      { name: 'Unarmed Combat', rating: 50 },
    ],
  },
  {
    profession: 'Engineer',
    bonusPoints: 8,
    skills: [
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Computer Science', rating: 40 },
      { name: 'Craft (Electrician)', rating: 60 },
      { name: 'Craft (Mechanic)', rating: 60 },
      { name: 'Craft (Microelectronics)', rating: 50 },
      { name: 'Science (Physics)', rating: 40 },
    ],
  },
  {
    profession: 'Foreign Service Officer',
    bonusPoints: 8,
    skills: [
      { name: 'Anthropology', rating: 40 },
      { name: 'Bureaucracy', rating: 60 },
      { name: 'Foreign Language (Arabic)', rating: 50 }, // TODO(verify) — player choice
      { name: 'Foreign Language (Russian)', rating: 50 }, // TODO(verify) — player choice
      { name: 'Foreign Language (Spanish)', rating: 40 }, // TODO(verify) — player choice
      { name: 'History', rating: 40 },
      { name: 'HUMINT', rating: 60 },
      { name: 'Law', rating: 30 },
      { name: 'Persuade', rating: 50 },
    ],
  },
  {
    profession: 'Lawyer',
    bonusPoints: 8,
    skills: [
      { name: 'Accounting', rating: 50 },
      { name: 'Bureaucracy', rating: 50 },
      { name: 'Criminology', rating: 50 },
      { name: 'HUMINT', rating: 50 },
      { name: 'Law', rating: 70 },
      { name: 'Persuade', rating: 60 },
      { name: 'Search', rating: 40 },
    ],
  },
  {
    profession: 'Marine',
    bonusPoints: 8, // TODO(verify)
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Athletics', rating: 60 },
      { name: 'Firearms', rating: 50 },
      { name: 'First Aid', rating: 30 },
      { name: 'Heavy Weapons', rating: 40 },
      { name: 'Melee Weapons', rating: 40 },
      { name: 'Military Science (Land)', rating: 40 },
      { name: 'Military Science (Sea)', rating: 40 },
      { name: 'Navigate', rating: 40 },
      { name: 'Survival', rating: 40 },
      { name: 'Swim', rating: 60 },
      { name: 'Unarmed Combat', rating: 60 },
    ],
  },
  {
    profession: 'Media Specialist',
    bonusPoints: 8,
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Anthropology', rating: 40 },
      { name: 'Art', rating: 50 },
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Foreign Language (Spanish)', rating: 40 }, // TODO(verify) — player choice
      { name: 'History', rating: 40 },
      { name: 'HUMINT', rating: 60 },
      { name: 'Persuade', rating: 60 },
    ],
  },
  {
    profession: 'Medical Doctor',
    bonusPoints: 8,
    skills: [
      { name: 'Bureaucracy', rating: 40 },
      { name: 'First Aid', rating: 60 },
      { name: 'Medicine', rating: 60 },
      { name: 'Persuade', rating: 40 },
      { name: 'Pharmacy', rating: 50 },
      { name: 'Science (Biology)', rating: 60 },
      { name: 'Search', rating: 40 },
      { name: 'Surgery', rating: 50 },
    ],
  },
  {
    profession: 'Nurse/EMT/Paramedic',
    bonusPoints: 8,
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Bureaucracy', rating: 30 },
      { name: 'Drive', rating: 50 },
      { name: 'First Aid', rating: 60 },
      { name: 'Medicine', rating: 40 },
      { name: 'Persuade', rating: 40 },
      { name: 'Pharmacy', rating: 40 },
      { name: 'Science (Biology)', rating: 40 },
      { name: 'Search', rating: 40 },
    ],
  },
  {
    profession: 'Pilot',
    bonusPoints: 8,
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Athletics', rating: 40 },
      { name: 'Bureaucracy', rating: 30 },
      { name: 'Craft (Mechanic)', rating: 30 },
      { name: 'Military Science (Land)', rating: 30 }, // TODO(verify) — air variant not in master list
      { name: 'Navigate', rating: 50 },
      { name: 'Pilot (Aircraft)', rating: 60 },
      { name: 'Science (Physics)', rating: 30 },
    ],
  },
  {
    profession: 'Police Detective',
    bonusPoints: 8,
    skills: [
      { name: 'Alertness', rating: 60 },
      { name: 'Athletics', rating: 40 },
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Criminology', rating: 60 },
      { name: 'Drive', rating: 40 },
      { name: 'Firearms', rating: 40 },
      { name: 'First Aid', rating: 30 },
      { name: 'Forensics', rating: 30 },
      { name: 'HUMINT', rating: 50 },
      { name: 'Law', rating: 30 },
      { name: 'Persuade', rating: 50 },
      { name: 'Search', rating: 50 },
      { name: 'Unarmed Combat', rating: 60 },
    ],
  },
  {
    profession: 'Sailor',
    bonusPoints: 8,
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Athletics', rating: 50 },
      { name: 'Craft (Mechanic)', rating: 40 },
      { name: 'Firearms', rating: 40 },
      { name: 'Military Science (Sea)', rating: 40 },
      { name: 'Navigate', rating: 50 },
      { name: 'Pilot (Boat)', rating: 60 },
      { name: 'Survival', rating: 40 },
      { name: 'Swim', rating: 60 },
      { name: 'Unarmed Combat', rating: 40 },
    ],
  },
  {
    profession: 'Soldier',
    bonusPoints: 8,
    skills: [
      { name: 'Alertness', rating: 50 },
      { name: 'Athletics', rating: 50 },
      { name: 'Bureaucracy', rating: 30 },
      { name: 'Drive', rating: 40 },
      { name: 'Firearms', rating: 50 },
      { name: 'First Aid', rating: 40 },
      { name: 'Heavy Weapons', rating: 40 },
      { name: 'Melee Weapons', rating: 40 },
      { name: 'Military Science (Land)', rating: 50 },
      { name: 'Navigate', rating: 40 },
      { name: 'Persuade', rating: 30 },
      { name: 'Survival', rating: 40 },
      { name: 'Unarmed Combat', rating: 50 },
    ],
  },
  {
    profession: 'Translator',
    bonusPoints: 8,
    skills: [
      { name: 'Anthropology', rating: 50 },
      { name: 'Bureaucracy', rating: 40 },
      { name: 'Foreign Language (Arabic)', rating: 60 }, // TODO(verify) — player choice
      { name: 'Foreign Language (Russian)', rating: 50 }, // TODO(verify) — player choice
      { name: 'Foreign Language (Spanish)', rating: 50 }, // TODO(verify) — player choice
      { name: 'History', rating: 40 },
      { name: 'HUMINT', rating: 50 },
      { name: 'Persuade', rating: 40 },
    ],
  },
] as const

/** Look up a package by profession (exact match). Returns undefined if unknown. */
export function getSkillPackage(profession: string): SkillPackage | undefined {
  return SKILL_PACKAGES.find((p) => p.profession === profession)
}

/**
 * Return a fresh skill list with the package's ratings, suitable as form
 * default values. Mutating the returned array (or its objects) does not
 * affect SKILL_PACKAGES. Returns an empty array if profession is unknown.
 */
export function applySkillPackage(profession: string): Array<{ name: string; rating: number }> {
  const pkg = getSkillPackage(profession)
  if (!pkg) return []
  return pkg.skills.map((s) => ({ name: s.name, rating: s.rating }))
}
