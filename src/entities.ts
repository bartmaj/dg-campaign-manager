/**
 * Frontend mirror of db/schema.ts entity types. Drives navigation and
 * route generation for the stubbed entity pages. Detailed forms land in
 * dedicated issues — the `futureIssue` field points there.
 */
export type EntityKey =
  | 'scenarios'
  | 'scenes'
  | 'pcs'
  | 'npcs'
  | 'clues'
  | 'items'
  | 'factions'
  | 'locations'
  | 'sessions'
  | 'bonds'

export type EntityConfig = {
  key: EntityKey
  path: string
  label: string
  singular: string
  futureIssue: string
}

export const ENTITIES: readonly EntityConfig[] = [
  {
    key: 'scenarios',
    path: '/scenarios',
    label: 'Scenarios',
    singular: 'Scenario',
    futureIssue: '#014',
  },
  { key: 'scenes', path: '/scenes', label: 'Scenes', singular: 'Scene', futureIssue: '#014' },
  { key: 'pcs', path: '/pcs', label: 'PCs', singular: 'PC', futureIssue: '#005' },
  { key: 'npcs', path: '/npcs', label: 'NPCs', singular: 'NPC', futureIssue: '#006' },
  { key: 'clues', path: '/clues', label: 'Clues', singular: 'Clue', futureIssue: '#010' },
  { key: 'items', path: '/items', label: 'Items', singular: 'Item', futureIssue: '#008' },
  {
    key: 'factions',
    path: '/factions',
    label: 'Factions',
    singular: 'Faction',
    futureIssue: '#008',
  },
  {
    key: 'locations',
    path: '/locations',
    label: 'Locations',
    singular: 'Location',
    futureIssue: '#008',
  },
  {
    key: 'sessions',
    path: '/sessions',
    label: 'Sessions',
    singular: 'Session',
    futureIssue: '#013',
  },
  { key: 'bonds', path: '/bonds', label: 'Bonds', singular: 'Bond', futureIssue: '#011' },
] as const
