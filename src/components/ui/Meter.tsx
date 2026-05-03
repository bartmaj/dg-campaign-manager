// Meter — typed progress/SAN bar. Tone shifts ok→warn→danger as fill drops.
// No className passthrough — see #033.
type Tone = 'ok' | 'warn' | 'danger'

type Props = {
  current: number
  max: number
  ariaLabel: string
}

function pickTone(pct: number): Tone {
  if (pct >= 60) return 'ok'
  if (pct >= 30) return 'warn'
  return 'danger'
}

const toneClass: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
}

function Meter({ current, max, ariaLabel }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const tone = pickTone(pct)
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current}
      className="w-full max-w-sm h-3 bg-surface-2 border border-border rounded-sm overflow-hidden"
    >
      <div
        className={`h-full transition-[width] ${toneClass[tone]}`}
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

export default Meter
