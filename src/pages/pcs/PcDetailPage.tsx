import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { BondRow } from '../../api/bonds'
import type { PcRow } from '../../api/pcs'
import type { SanChangeEvent } from '../../api/sanity'
import EntityRecentActivity from '../../components/EntityRecentActivity/EntityRecentActivity'
import EntityRelationships from '../../components/EntityRelationships/EntityRelationships'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import DescriptionList from '../../components/ui/DescriptionList'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import IconButton from '../../components/ui/IconButton'
import Inline from '../../components/ui/Inline'
import Input from '../../components/ui/Input'
import LinkButton from '../../components/ui/LinkButton'
import Meter from '../../components/ui/Meter'
import Prose from '../../components/ui/Prose'
import Select from '../../components/ui/Select'
import Stack from '../../components/ui/Stack'
import Toolbar from '../../components/ui/Toolbar'
import { useApplyBondDamage } from '../../hooks/useApplyBondDamage'
import { useApplySanityChange } from '../../hooks/useApplySanityChange'
import { useBond, useBondsForPc, useIncomingBonds } from '../../hooks/useBonds'
import { useCreateBond } from '../../hooks/useCreateBond'
import { useDeleteBond } from '../../hooks/useDeleteBond'
import { useEntityNames } from '../../hooks/useEntityNames'
import { useNpcs } from '../../hooks/useNpcs'
import { usePatchPcSanityLists } from '../../hooks/usePatchPcSanityLists'
import { usePc } from '../../hooks/usePcs'
import { useSanEvents } from '../../hooks/useSanity'

function BondRowView({ bond }: { bond: BondRow }) {
  const { data, isLoading } = useBond(bond.id)
  const apply = useApplyBondDamage()
  // Resolve the bonded NPC's name. The PC who owns the bond is implicit on
  // this page, so only the *target* needs a human-readable label.
  const namesQuery = useEntityNames('npc', bond.targetType === 'npc' ? [bond.targetId] : [])
  const targetName = namesQuery.data?.items.find((n) => n.id === bond.targetId)?.name
  const remove = useDeleteBond()
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const events = data?.events ?? []
  const visibleEvents = showAll ? events : events.slice(-3).reverse()

  async function onApply(e: React.FormEvent, sign: 1 | -1) {
    e.preventDefault()
    setFormError(null)
    const magnitude = Number.parseInt(delta, 10)
    if (!Number.isFinite(magnitude) || magnitude <= 0) {
      setFormError('Enter a positive integer.')
      return
    }
    try {
      await apply.mutateAsync({
        bondId: bond.id,
        input: {
          delta: sign * magnitude,
          reason: reason.trim() === '' ? null : reason.trim(),
          sessionId: sessionId.trim() === '' ? null : sessionId.trim(),
        },
      })
      setDelta('')
      setReason('')
      setSessionId('')
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  const current = data?.bond.currentScore ?? bond.currentScore
  const max = data?.bond.maxScore ?? bond.maxScore

  return (
    <li>
      <Stack gap="xs">
        <p>
          <strong>{bond.name}</strong> — {current} / {max}
          {bond.targetType === 'npc' && bond.targetId ? (
            <>
              {' · '}
              <Link to={`/npcs/${bond.targetId}`}>{targetName ?? '(unnamed NPC)'}</Link>
            </>
          ) : null}
        </p>
        {bond.description ? <p>{bond.description}</p> : null}
        <form onSubmit={(e) => void onApply(e, -1)}>
          <Inline gap="sm">
            <Input
              type="number"
              min="1"
              step="1"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="amount"
              aria-label="Damage amount"
            />
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="reason"
              aria-label="Reason"
            />
            <Input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="session id (optional)"
              aria-label="Session ID"
            />
            <Button type="submit" disabled={apply.isPending}>
              Damage
            </Button>
            <Button type="button" disabled={apply.isPending} onClick={(e) => void onApply(e, 1)}>
              Repair
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void remove.mutateAsync(bond.id)}
              disabled={remove.isPending}
            >
              ✕ Delete bond
            </Button>
          </Inline>
        </form>
        {formError && <p>{formError}</p>}
        <details>
          <summary>History {isLoading ? '(loading…)' : `(${events.length})`}</summary>
          {events.length === 0 ? (
            <p>—</p>
          ) : (
            <Stack gap="xs">
              <ul>
                {visibleEvents.map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.delta > 0 ? `+${ev.delta}` : ev.delta}</strong>
                    {ev.reason ? ` — ${ev.reason}` : ''}
                    {ev.sessionId ? ` · session ${ev.sessionId}` : ''}
                    {' · '}
                    <em>{new Date(ev.appliedAt).toLocaleString()}</em>
                  </li>
                ))}
              </ul>
              {events.length > 3 && (
                <Button type="button" size="sm" onClick={() => setShowAll((s) => !s)}>
                  {showAll ? 'Show last 3' : `View all ${events.length}`}
                </Button>
              )}
            </Stack>
          )}
        </details>
      </Stack>
    </li>
  )
}

function AddBondForm({ pcId }: { pcId: string }) {
  const create = useCreateBond()
  const npcsQuery = useNpcs()
  const npcs = npcsQuery.data ?? []
  const [name, setName] = useState('')
  const [targetId, setTargetId] = useState('')
  const [maxScore, setMaxScore] = useState('12')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const max = Number.parseInt(maxScore, 10)
    if (!Number.isFinite(max) || max < 0) {
      setFormError('Max score must be a non-negative integer.')
      return
    }
    if (name.trim() === '' || targetId.trim() === '') {
      setFormError('Name and bonded NPC are required.')
      return
    }
    try {
      await create.mutateAsync({
        pcId,
        name: name.trim(),
        targetType: 'npc',
        targetId: targetId.trim(),
        maxScore: max,
        description: description.trim() === '' ? null : description.trim(),
      })
      setName('')
      setTargetId('')
      setMaxScore('12')
      setDescription('')
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <Stack gap="sm">
        <Field label="Name">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sister Mary"
          />
        </Field>
        <Field
          label="Bonded NPC"
          helper={
            npcsQuery.isLoading
              ? 'Loading NPCs…'
              : npcs.length === 0
                ? 'No NPCs yet — create one first.'
                : undefined
          }
        >
          <Select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={npcs.length === 0}
          >
            <option value="">— Select an NPC —</option>
            {npcs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Max score">
          <Input
            type="number"
            min="0"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
          />
        </Field>
        <Field label="Description (optional)">
          <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Toolbar align="start">
          <Button type="submit" variant="primary" disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add Bond'}
          </Button>
        </Toolbar>
        {formError && <p>{formError}</p>}
      </Stack>
    </form>
  )
}

function SanityListEditor({
  pc,
  field,
  label,
  parse,
  format,
}: {
  pc: PcRow
  field: 'breakingPoints' | 'sanityDisorders' | 'adaptedTo'
  label: string
  parse: (raw: string) => string[] | number[]
  format: (values: string[] | number[]) => string
}) {
  const patch = usePatchPcSanityLists()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const values = (pc[field] ?? []) as string[] | number[]

  function start() {
    setText(format(values))
    setErr(null)
    setEditing(true)
  }

  async function save() {
    setErr(null)
    try {
      const parsed = parse(text)
      await patch.mutateAsync({ pcId: pc.id, patch: { [field]: parsed } })
      setEditing(false)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div>
      <Inline gap="sm">
        <strong>{label}:</strong>
        {!editing && (
          <>
            {values.length === 0 ? (
              <em>none</em>
            ) : (
              <ul>
                {values.map((v, i) => (
                  <li key={`${field}-${i}`}>{String(v)}</li>
                ))}
              </ul>
            )}
            <IconButton aria-label={`Edit ${label}`} onClick={start}>
              ✎
            </IconButton>
          </>
        )}
        {editing && (
          <>
            <Input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="comma-separated"
              aria-label={`${label} (comma-separated)`}
            />
            <Button type="button" onClick={() => void save()} disabled={patch.isPending}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            {err && <span>{err}</span>}
          </>
        )}
      </Inline>
    </div>
  )
}

function SanEventRow({ ev }: { ev: SanChangeEvent }) {
  const crossed = ev.crossedThresholds ?? []
  return (
    <li>
      <Inline gap="sm">
        <span>
          <strong>{ev.delta > 0 ? `+${ev.delta}` : ev.delta}</strong> — {ev.source}
          {ev.sessionId ? ` · session ${ev.sessionId}` : ''}
          {' · '}
          <em>{new Date(ev.appliedAt).toLocaleString()}</em>
        </span>
        {crossed.length > 0 && <Badge variant="warn">crossed {crossed.join(', ')}</Badge>}
      </Inline>
    </li>
  )
}

function SanitySection({ pc }: { pc: PcRow }) {
  const apply = useApplySanityChange()
  const { data: events = [] } = useSanEvents(pc.id)
  const [magnitude, setMagnitude] = useState('')
  const [source, setSource] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [flash, setFlash] = useState<number[] | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!flash || flash.length === 0) return
    const t = window.setTimeout(() => setFlash(null), 6000)
    return () => window.clearTimeout(t)
  }, [flash])

  const current = pc.sanityCurrent ?? pc.sanMax
  const breakingPoints = pc.breakingPoints ?? []
  const visibleEvents = showAll ? events : events.slice(0, 5)

  async function onSubmit(e: React.FormEvent, sign: 1 | -1) {
    e.preventDefault()
    setFormError(null)
    const m = Number.parseInt(magnitude, 10)
    if (!Number.isFinite(m) || m <= 0) {
      setFormError('Enter a positive integer.')
      return
    }
    if (source.trim() === '') {
      setFormError('Source is required.')
      return
    }
    try {
      const result = await apply.mutateAsync({
        pcId: pc.id,
        input: {
          delta: sign * m,
          source: source.trim(),
          sessionId: sessionId.trim() === '' ? null : sessionId.trim(),
        },
      })
      setMagnitude('')
      setSource('')
      setSessionId('')
      if (result.crossedThresholds.length > 0) {
        setFlash(result.crossedThresholds)
      }
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <Card>
      <Stack gap="sm">
        <Heading level={2}>Sanity</Heading>
        <p>
          <strong>
            {current} / {pc.sanMax}
          </strong>
        </p>
        <Meter current={current} max={pc.sanMax} ariaLabel="Sanity" />

        {flash && flash.length > 0 && (
          <Card>
            <Inline gap="sm">
              <Badge variant="warn">Threshold crossed</Badge>
              <span>
                <strong>Breaking-point crossed: {flash.join(', ')}.</strong> Consider recording a
                disorder or adapted-to.
              </span>
              <IconButton aria-label="Dismiss" onClick={() => setFlash(null)}>
                ✕
              </IconButton>
            </Inline>
          </Card>
        )}

        <Stack gap="xs">
          <SanityListEditor
            pc={pc}
            field="breakingPoints"
            label="Breaking points"
            parse={(raw) =>
              raw
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
                .map((s) => {
                  const n = Number.parseInt(s, 10)
                  if (!Number.isFinite(n)) throw new Error(`"${s}" is not an integer`)
                  return n
                })
            }
            format={(vs) => (vs as number[]).join(', ')}
          />
          <SanityListEditor
            pc={pc}
            field="sanityDisorders"
            label="Disorders"
            parse={(raw) =>
              raw
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
            }
            format={(vs) => (vs as string[]).join(', ')}
          />
          <SanityListEditor
            pc={pc}
            field="adaptedTo"
            label="Adapted to"
            parse={(raw) =>
              raw
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
            }
            format={(vs) => (vs as string[]).join(', ')}
          />
        </Stack>

        <Heading level={3}>Apply SAN change</Heading>
        <form onSubmit={(e) => void onSubmit(e, -1)}>
          <Stack gap="sm">
            <Inline gap="sm">
              <Input
                type="number"
                min="1"
                step="1"
                value={magnitude}
                onChange={(e) => setMagnitude(e.target.value)}
                placeholder="amount"
                aria-label="SAN amount"
              />
              <Input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="source (required)"
                aria-label="Source"
              />
              <Input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="session id (optional)"
                aria-label="Session ID"
              />
              <Button type="submit" disabled={apply.isPending}>
                Loss
              </Button>
              <Button type="button" disabled={apply.isPending} onClick={(e) => void onSubmit(e, 1)}>
                Gain
              </Button>
            </Inline>
          </Stack>
        </form>
        {formError && <p>{formError}</p>}
        {breakingPoints.length === 0 && (
          <p>
            <em>No breaking points configured. Add some above to enable threshold detection.</em>
          </p>
        )}

        <Heading level={3}>SAN history</Heading>
        {events.length === 0 ? (
          <p>—</p>
        ) : (
          <Stack gap="xs">
            <ul>
              {visibleEvents.map((ev) => (
                <SanEventRow key={ev.id} ev={ev} />
              ))}
            </ul>
            {events.length > 5 && (
              <Button type="button" size="sm" onClick={() => setShowAll((s) => !s)}>
                {showAll ? 'Show last 5' : `Show all ${events.length}`}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

function PcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: pc, isLoading, error } = usePc(id)
  const { data: bonds = [] } = useBondsForPc(id)
  const { data: incomingBonds = [] } = useIncomingBonds('pc', id)

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed to load: {error.message}</p>
  if (!pc) return <p>PC not found.</p>

  return (
    <Stack gap="md">
      <p>
        <Link to="/pcs">← All PCs</Link>
      </p>
      <Toolbar align="between">
        <Heading level={1}>{pc.name}</Heading>
        <LinkButton href={`/api/pcs/${pc.id}/export`} variant="ghost" download>
          Download as Markdown
        </LinkButton>
      </Toolbar>

      {pc.profession && <p>Profession: {pc.profession}</p>}

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Stats</Heading>
          <DescriptionList
            items={[
              { term: 'STR', details: pc.str },
              { term: 'CON', details: pc.con },
              { term: 'DEX', details: pc.dex },
              { term: 'INT', details: pc.intelligence },
              { term: 'POW', details: pc.pow },
              { term: 'CHA', details: pc.cha },
            ]}
          />
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Derived</Heading>
          <DescriptionList
            items={[
              { term: 'HP', details: pc.hp },
              { term: 'WP', details: pc.wp },
              { term: 'Breaking Point', details: pc.bp },
              { term: 'SAN max', details: pc.sanMax },
            ]}
          />
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Skills</Heading>
          {pc.skills && pc.skills.length > 0 ? (
            <ul>
              {pc.skills.map((s, i) => (
                <li key={`${s.name}-${i}`}>
                  {s.name}: {s.rating}
                </li>
              ))}
            </ul>
          ) : (
            <p>No skills recorded.</p>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Motivations</Heading>
          {pc.motivations && pc.motivations.length > 0 ? (
            <ul>
              {pc.motivations.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          ) : (
            <p>No motivations recorded.</p>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Backstory hooks</Heading>
          <Prose>{pc.backstoryHooks ?? '—'}</Prose>
        </Stack>
      </Card>

      <Card>
        <Stack gap="sm">
          <Heading level={2}>Bonds</Heading>
          {bonds.length === 0 ? (
            <p>No bonds yet.</p>
          ) : (
            <ul>
              {bonds.map((b) => (
                <BondRowView key={b.id} bond={b} />
              ))}
            </ul>
          )}
          <Heading level={3}>Add Bond</Heading>
          {id && <AddBondForm pcId={id} />}
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

      <SanitySection pc={pc} />

      {id && <EntityRelationships entityType="pc" entityId={id} />}
      {id && <EntityRecentActivity entityType="pc" entityId={id} />}
    </Stack>
  )
}

export default PcDetailPage
