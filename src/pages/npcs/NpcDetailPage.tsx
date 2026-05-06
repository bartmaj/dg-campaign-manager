import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import type { NpcStatus } from '../../../domain/npc'
import DeleteEntityButton from '../../components/DeleteEntityButton/DeleteEntityButton'
import EntityRecentActivity from '../../components/EntityRecentActivity/EntityRecentActivity'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import DescriptionList from '../../components/ui/DescriptionList'
import EditOnly from '../../components/ui/EditOnly'
import Heading from '../../components/ui/Heading'
import Inline from '../../components/ui/Inline'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useIncomingBonds } from '../../hooks/useBonds'
import { useDeleteNpc } from '../../hooks/useDeleteNpc'
import { useEntityNames } from '../../hooks/useEntityNames'
import { useNpc } from '../../hooks/useNpcs'
import { useNpcEncounters } from '../../hooks/useNpcEncounters'

// Status -> Badge variant mapping (also used in NpcListPage).
// alive -> ok, missing -> warn, turned -> danger, dead -> neutral.
function statusVariant(s: NpcStatus): 'ok' | 'warn' | 'danger' | 'neutral' {
  if (s === 'alive') return 'ok'
  if (s === 'missing') return 'warn'
  if (s === 'turned') return 'danger'
  return 'neutral'
}

function NpcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: npc, isLoading, error } = useNpc(id)
  const { data: incomingBonds = [] } = useIncomingBonds('npc', id)
  const deleteNpc = useDeleteNpc()

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!npc) return <p>NPC not found.</p>

  const hasFullStats = npc.str !== null && npc.con !== null && npc.dex !== null

  return (
    <Stack gap="md">
      <p>
        <Link to="/npcs">← All NPCs</Link>
      </p>
      <Toolbar align="between">
        <Inline gap="sm">
          <Heading level={1}>{npc.name}</Heading>
          {/* Continuity dimension #4: Status */}
          <Badge variant={statusVariant(npc.status)}>{npc.status}</Badge>
        </Inline>
        <Inline gap="sm">
          <LinkButton href={`/api/npcs/${npc.id}/export`} variant="ghost" download>
            Download as Markdown
          </LinkButton>
          <EditOnly>
            <DeleteEntityButton
              onConfirm={() => deleteNpc.mutateAsync(npc.id).then(() => undefined)}
              entityLabel="NPC"
              entityName={npc.name}
              redirectTo="/npcs"
            />
          </EditOnly>
        </Inline>
      </Toolbar>

      {npc.profession && <p>Profession: {npc.profession}</p>}

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Stat block</Heading>
          {hasFullStats ? (
            <DescriptionList
              items={[
                { term: 'STR', details: npc.str },
                { term: 'CON', details: npc.con },
                { term: 'DEX', details: npc.dex },
                { term: 'INT', details: npc.intelligence },
                { term: 'POW', details: npc.pow },
                { term: 'CHA', details: npc.cha },
              ]}
            />
          ) : (
            <p>
              <em>Simplified.</em>
            </p>
          )}
          <p>
            HP: {npc.hp ?? '—'} · WP: {npc.wp ?? '—'}
          </p>
        </Stack>
      </Card>

      {/* Continuity dimension #1: RP hooks */}
      <Card>
        <Stack gap="sm">
          <Heading level={2}>RP hooks</Heading>
          <DescriptionList
            items={[
              { term: 'Mannerisms', details: <Prose>{npc.mannerisms ?? '—'}</Prose> },
              { term: 'Voice', details: npc.voice ?? '—' },
              { term: 'Secrets', details: <Prose>{npc.secrets ?? '—'}</Prose> },
            ]}
          />
        </Stack>
      </Card>

      {/* Continuity dimension #2: Faction */}
      <Card>
        <Stack gap="sm">
          <Heading level={2}>Faction</Heading>
          <p>{npc.factionId ?? '—'}</p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Bonds with this character</Heading>
          {incomingBonds.length === 0 ? (
            <p>—</p>
          ) : (
            <ul>
              {incomingBonds.map((b) => (
                <li key={b.id}>
                  <Link to={`/pcs/${b.pcId}`}>{b.pcId}</Link>: {b.name} ({b.currentScore}/
                  {b.maxScore})
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Current goal</Heading>
          <p>{npc.currentGoal ?? '—'}</p>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Location</Heading>
          <p>{npc.locationId ?? '—'}</p>
        </Stack>
      </Card>

      {id && <EncounterHistoryCard npcId={id} />}

      {id && <EntityRelationships entityType="npc" entityId={id} />}
      {id && <EntityRecentActivity entityType="npc" entityId={id} />}
    </Stack>
  )
}

function EncounterHistoryCard({ npcId }: { npcId: string }) {
  const { data, isLoading } = useNpcEncounters(npcId)
  const items = useMemo(() => data?.items ?? [], [data])
  const sessionIds = useMemo(() => [...new Set(items.map((i) => i.sessionId))], [items])
  const sessionNamesQ = useEntityNames('session', sessionIds)
  const nameById = useMemo(
    () => new Map((sessionNamesQ.data?.items ?? []).map((r) => [r.id, r.name])),
    [sessionNamesQ.data],
  )

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Encounter history</Heading>
        {isLoading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>No encounters logged yet.</p>
        ) : (
          <ul>
            {items.map((evt) => (
              <li key={evt.id}>
                <Link to={`/sessions/${evt.sessionId}`}>
                  {nameById.get(evt.sessionId) ?? evt.sessionId}
                </Link>
                {' · '}
                <span>{new Date(evt.appliedAt).toISOString().slice(0, 10)}</span>
                {evt.note ? ` — ${evt.note}` : null}
              </li>
            ))}
          </ul>
        )}
      </Stack>
    </Card>
  )
}

export default NpcDetailPage
