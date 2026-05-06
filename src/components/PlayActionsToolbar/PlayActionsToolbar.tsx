// Play-mode primary actions toolbar (#024).
//
// Sticky bottom-right floater visible only in play mode. Hosts the five
// at-table actions (Cmd-K, mark clue delivered, log SAN, log Bond
// damage, jump to current Session) plus their keyboard shortcuts via
// react-hotkeys-hook. Shortcuts are gated to play mode and ignored when
// focus is in an editable element (the lib's default for hotkeys
// without `enableOnFormTags`).
//
// This file is a design-system component — it consumes Tailwind tokens
// directly (bg-surface, text-ink, etc.). All inner controls are
// composed from primitives.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useHotkeys } from 'react-hotkeys-hook'
import { useIsPlayMode } from '../../lib/mode'
import { useCurrentSessionId } from '../../lib/currentSession'
import { usePcs } from '../../hooks/usePcs'
import { useClues } from '../../hooks/useClues'
import { useAllBonds } from '../../hooks/useBonds'
import { useApplySanityChange } from '../../hooks/useApplySanityChange'
import { useApplyBondDamage } from '../../hooks/useApplyBondDamage'
import { useCreateClueDeliveryEvent } from '../../hooks/useClueDelivery'
import { requestOpenPalette } from '../CmdK/openPalette'
import Button from '../ui/Button'
import Stack from '../ui/Stack'
import Inline from '../ui/Inline'
import KbdHint from '../ui/KbdHint'
import Field from '../ui/Field'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Heading from '../ui/Heading'

type PopoverKey = 'clue' | 'san' | 'bond' | null

export function PlayActionsToolbar() {
  const isPlayMode = useIsPlayMode()
  const navigate = useNavigate()
  const { value: currentSessionId } = useCurrentSessionId()
  const [popover, setPopover] = useState<PopoverKey>(null)

  const openPalette = () => requestOpenPalette()
  const openPopover = (key: PopoverKey) => setPopover(key)
  const close = () => setPopover(null)
  const jumpToSession = () => {
    if (currentSessionId) navigate(`/sessions/${currentSessionId}`)
  }

  // Shortcuts are scoped to play mode; the lib ignores keypresses inside
  // form elements by default (no `enableOnFormTags` opts-in here), so
  // typing in inputs/textareas/selects won't fire any of these.
  const hotkeyOpts = { enabled: isPlayMode }
  useHotkeys('k', openPalette, hotkeyOpts, [isPlayMode])
  useHotkeys('d', () => openPopover('clue'), hotkeyOpts, [isPlayMode])
  useHotkeys('s', () => openPopover('san'), hotkeyOpts, [isPlayMode])
  useHotkeys('b', () => openPopover('bond'), hotkeyOpts, [isPlayMode])
  useHotkeys('j', jumpToSession, hotkeyOpts, [isPlayMode, currentSessionId])

  if (!isPlayMode) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2"
      role="region"
      aria-label="Play-mode primary actions"
    >
      {popover === 'clue' && <ClueDeliveredPopover onClose={close} />}
      {popover === 'san' && <LogSanPopover onClose={close} />}
      {popover === 'bond' && <LogBondPopover onClose={close} />}

      <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <ToolbarButton label="Cmd-K palette" hint="K" onClick={openPalette} />
        <ToolbarButton label="Clue delivered" hint="D" onClick={() => openPopover('clue')} />
        <ToolbarButton label="Log SAN change" hint="S" onClick={() => openPopover('san')} />
        <ToolbarButton label="Log Bond damage" hint="B" onClick={() => openPopover('bond')} />
        <ToolbarButton
          label="Jump to current session"
          hint="J"
          onClick={jumpToSession}
          disabled={!currentSessionId}
          title={currentSessionId ? undefined : 'No current session set'}
        />
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  hint,
  onClick,
  disabled,
  title,
}: {
  label: string
  hint: string
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <div title={title}>
      <Button onClick={onClick} disabled={disabled}>
        <Inline gap="sm">
          <span>{label}</span>
          <KbdHint>{hint}</KbdHint>
        </Inline>
      </Button>
    </div>
  )
}

// ─── Popover shell ─────────────────────────────────────────────────────────

function PopoverShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on Esc and click outside.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className="w-[min(380px,92vw)] rounded-md border border-border bg-surface text-ink p-3 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
    >
      <Stack gap="sm">
        <Heading level={3}>{title}</Heading>
        {children}
      </Stack>
    </div>
  )
}

// ─── Clue delivered ────────────────────────────────────────────────────────

function ClueDeliveredPopover({ onClose }: { onClose: () => void }) {
  const { value: currentSessionId } = useCurrentSessionId()
  const cluesQ = useClues()
  const pcsQ = usePcs()
  const [clueId, setClueId] = useState('')
  const [pcIds, setPcIds] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createDelivery = useCreateClueDeliveryEvent(clueId || undefined)

  function togglePc(pcId: string) {
    setPcIds((prev) => (prev.includes(pcId) ? prev.filter((p) => p !== pcId) : [...prev, pcId]))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!clueId) {
      setError('Pick a clue.')
      return
    }
    if (!currentSessionId) {
      setError('No current session — set one first.')
      return
    }
    if (pcIds.length === 0) {
      setError('Pick at least one PC.')
      return
    }
    try {
      await createDelivery.mutateAsync({
        sessionId: currentSessionId,
        kind: 'delivered',
        pcIds,
        note: note.trim() === '' ? null : note.trim(),
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const submitDisabled = createDelivery.isPending || !currentSessionId

  return (
    <PopoverShell title="Mark clue delivered" onClose={onClose}>
      <form onSubmit={(e) => void onSubmit(e)}>
        <Stack gap="sm">
          <Field label="Clue">
            <Select value={clueId} onChange={(e) => setClueId(e.target.value)}>
              <option value="">— pick a clue —</option>
              {(cluesQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Recipient PCs">
            <Stack gap="xs">
              {(pcsQ.data ?? []).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pcIds.includes(p.id)}
                    onChange={() => togglePc(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </Stack>
          </Field>
          <Field label="Note (optional)">
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Found at the alley"
            />
          </Field>
          {!currentSessionId && (
            <p className="text-xs text-danger">
              No current session set — open a Session and choose “Set as current session”.
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          <Inline gap="sm">
            <Button type="submit" variant="primary" disabled={submitDisabled}>
              {createDelivery.isPending ? 'Marking…' : 'Mark delivered'}
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </Inline>
        </Stack>
      </form>
    </PopoverShell>
  )
}

// ─── Log SAN change ────────────────────────────────────────────────────────

function LogSanPopover({ onClose }: { onClose: () => void }) {
  const { value: currentSessionId } = useCurrentSessionId()
  const pcsQ = usePcs()
  const applySan = useApplySanityChange()
  const [pcId, setPcId] = useState('')
  const [magnitude, setMagnitude] = useState('1')
  const [source, setSource] = useState('')
  const [direction, setDirection] = useState<'loss' | 'gain'>('loss')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const mag = Math.abs(parseInt(magnitude, 10))
    if (!pcId || !Number.isFinite(mag) || mag === 0 || source.trim() === '') {
      setError('Pick a PC, set magnitude > 0, and a source.')
      return
    }
    const delta = direction === 'loss' ? -mag : mag
    try {
      await applySan.mutateAsync({
        pcId,
        input: { delta, source: source.trim(), sessionId: currentSessionId ?? null },
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <PopoverShell title="Log SAN change" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)}>
        <Stack gap="sm">
          <Field label="Player character">
            <Select value={pcId} onChange={(e) => setPcId(e.target.value)}>
              <option value="">— pick a PC —</option>
              {(pcsQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Magnitude">
            <Input
              type="number"
              min={1}
              value={magnitude}
              onChange={(e) => setMagnitude(e.target.value)}
            />
          </Field>
          <Field label="Source">
            <Input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Witnessed Hound"
            />
          </Field>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Inline gap="sm">
            <Button
              type="submit"
              variant="danger"
              disabled={applySan.isPending}
              onClick={() => setDirection('loss')}
            >
              Log loss
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={applySan.isPending}
              onClick={() => setDirection('gain')}
            >
              Log gain
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </Inline>
        </Stack>
      </form>
    </PopoverShell>
  )
}

// ─── Log Bond damage ───────────────────────────────────────────────────────

function LogBondPopover({ onClose }: { onClose: () => void }) {
  const { value: currentSessionId } = useCurrentSessionId()
  const bondsQ = useAllBonds()
  const applyBondDamage = useApplyBondDamage()
  const [bondId, setBondId] = useState('')
  const [magnitude, setMagnitude] = useState('1')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const mag = Math.abs(parseInt(magnitude, 10))
    if (!bondId || !Number.isFinite(mag) || mag === 0) {
      setError('Pick a bond and set magnitude > 0.')
      return
    }
    try {
      await applyBondDamage.mutateAsync({
        bondId,
        input: {
          delta: -mag,
          reason: reason.trim() === '' ? null : reason.trim(),
          sessionId: currentSessionId ?? null,
        },
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <PopoverShell title="Log Bond damage" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)}>
        <Stack gap="sm">
          <Field label="Bond">
            <Select value={bondId} onChange={(e) => setBondId(e.target.value)}>
              <option value="">— pick a bond —</option>
              {(bondsQ.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.currentScore}/{b.maxScore})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Magnitude">
            <Input
              type="number"
              min={1}
              value={magnitude}
              onChange={(e) => setMagnitude(e.target.value)}
            />
          </Field>
          <Field label="Reason (optional)">
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Lied to spouse"
            />
          </Field>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Inline gap="sm">
            <Button type="submit" variant="danger" disabled={applyBondDamage.isPending}>
              {applyBondDamage.isPending ? 'Logging…' : 'Log damage'}
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </Inline>
        </Stack>
      </form>
    </PopoverShell>
  )
}

export default PlayActionsToolbar
