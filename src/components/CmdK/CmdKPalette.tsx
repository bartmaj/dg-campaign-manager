import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { searchMatch, type SearchMatchResult } from '../../../domain/searchMatch'
import { useSearchIndex } from '../../hooks/useSearchIndex'
import { ENTITY_TYPE_LABEL, resolveResultPath } from './entityRoutes'
import { useCmdKShortcut } from './useCmdKShortcut'
import './cmdk.css'

const MIN_QUERY_LENGTH = 3
const RESULT_LIMIT = 50

/**
 * Outer wrapper: owns the `isOpen` flag and the global Cmd-K shortcut.
 * The inner palette component only mounts while open, so its local
 * state (query, active index, focus) resets cleanly per session — no
 * setState-in-useEffect dance required.
 */
export function CmdKPalette() {
  const [isOpen, setIsOpen] = useState(false)
  useCmdKShortcut(() => setIsOpen((v) => !v))
  if (!isOpen) return null
  return <PaletteDialog onClose={() => setIsOpen(false)} />
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [rawActiveIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { items, isLoading } = useSearchIndex()

  // Focus the input on mount.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo<SearchMatchResult[]>(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) return []
    return searchMatch(query, items, { limit: RESULT_LIMIT })
  }, [query, items])

  // Clamp the active index to the current results length without
  // setState-in-effect cascades. If the user typed and the results
  // shrank past the previous index, fall back to 0 for rendering.
  const activeIndex = results.length === 0 ? 0 : rawActiveIndex % results.length
  const activeIndexRef = useRef(activeIndex)
  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  function activate(result: SearchMatchResult) {
    const path = resolveResultPath(result)
    if (!path) return
    onClose()
    navigate(path)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (results.length === 0) return
      setActiveIndex((activeIndexRef.current + 1) % results.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (results.length === 0) return
      setActiveIndex((activeIndexRef.current - 1 + results.length) % results.length)
      return
    }
    if (event.key === 'Enter') {
      const r = results[activeIndexRef.current]
      if (r) {
        event.preventDefault()
        activate(r)
      }
    }
  }

  const queryTrimmed = query.trim()
  const showHint = queryTrimmed.length < MIN_QUERY_LENGTH
  const showEmpty = !showHint && results.length === 0
  const showLoading = isLoading && items.length === 0

  return (
    <div className="cmdk-backdrop" onClick={onClose} role="presentation">
      <div
        className="cmdk-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          type="text"
          className="cmdk-input"
          placeholder="Search PCs, NPCs, scenes…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
          }}
          aria-label="Search query"
          aria-autocomplete="list"
          aria-controls="cmdk-results"
          autoComplete="off"
          spellCheck={false}
          data-cmdk-input="true"
        />
        <div id="cmdk-results" className="cmdk-results" role="listbox">
          {showLoading && <div className="cmdk-status">Loading index…</div>}
          {!showLoading && showHint && (
            <div className="cmdk-status">Type at least {MIN_QUERY_LENGTH} characters to search</div>
          )}
          {!showLoading && showEmpty && <div className="cmdk-status">No matches</div>}
          {!showLoading &&
            results.map((r, i) => (
              <Result
                key={`${r.type}:${r.id}`}
                result={r}
                active={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onSelect={() => activate(r)}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

function Result({
  result,
  active,
  onMouseEnter,
  onSelect,
}: {
  result: SearchMatchResult
  active: boolean
  onMouseEnter: () => void
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`cmdk-result${active ? ' cmdk-result--active' : ''}`}
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
    >
      <span className="cmdk-result-type">{ENTITY_TYPE_LABEL[result.type]}</span>
      <span className="cmdk-result-name">
        <HighlightedName name={result.name} ranges={result.matchedRanges} />
      </span>
      {result.subtitle && <span className="cmdk-result-subtitle">{result.subtitle}</span>}
    </button>
  )
}

function HighlightedName({
  name,
  ranges,
}: {
  name: string
  ranges: ReadonlyArray<readonly [number, number]>
}) {
  if (ranges.length === 0) return <>{name}</>
  // Ranges from searchMatch are already in ascending order, non-overlapping.
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i]!
    const [start, end] = r
    if (start > cursor) {
      parts.push(<span key={`p${i}`}>{name.slice(cursor, start)}</span>)
    }
    parts.push(<mark key={`m${i}`}>{name.slice(start, end)}</mark>)
    cursor = end
  }
  if (cursor < name.length) {
    parts.push(<span key="tail">{name.slice(cursor)}</span>)
  }
  return <>{parts}</>
}
