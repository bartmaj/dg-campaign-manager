import { useState } from 'react'
import { Link } from 'react-router'

type Counts = {
  locations: number
  factions: number
  npcs: number
  items: number
  clues: number
  scenes: number
  edges: number
}

type ImportSuccess = { scenarioId: string; counts: Counts }
type ImportError = { line: number; field: string; message: string }

const TEMPLATE_SAMPLE = `# Scenario: Operation Reverberate

- **Description**: A pre-dawn raid on a Newark warehouse goes sideways.

## Locations
### Newark
- **Description**: City context.

### Site Bravo
- **Description**: Abandoned warehouse.
- **Parent**: [[Newark]]

## Factions
### Cell Blue
- **Agenda**: Recover the Briefcase.

## NPCs
### Agent Marlow
- **Status**: alive
- **Faction**: [[Cell Blue]]
- **Location**: [[Site Bravo]]
- **Description**: A burned-out senior agent.

## Items
### Forensic Briefcase
- **Description**: Locked aluminium case.
- **Owner**: [[Agent Marlow]]
- **Location**: [[Site Bravo]]

## Clues
### Bloody letter
- **Description**: Half-burned letter.
- **Mentions**: [[Agent Marlow]]
- **Implicates**: [[Cell Blue]]
- **Points to**: [[Site Bravo]]

## Scenes
### Briefing
- **Description**: Players meet their handler.
- **Delivers clues**: [[Bloody letter]]
`

function ImportPage() {
  const [markdown, setMarkdown] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<ImportSuccess | null>(null)
  const [errors, setErrors] = useState<ImportError[] | null>(null)
  const [transportError, setTransportError] = useState<string | null>(null)
  const [showTemplate, setShowTemplate] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setMarkdown(text)
  }

  async function onImport() {
    setBusy(true)
    setSuccess(null)
    setErrors(null)
    setTransportError(null)
    try {
      const res = await fetch('/api/import/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      })
      const body = (await res.json()) as
        | ImportSuccess
        | { errors: ImportError[] }
        | { error: string }
      if (res.ok) {
        setSuccess(body as ImportSuccess)
      } else if ('errors' in body) {
        setErrors(body.errors)
      } else {
        setTransportError(('error' in body && body.error) || `HTTP ${res.status}`)
      }
    } catch (err) {
      setTransportError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h1>Import scenario</h1>
      <p>
        Paste a scenario Markdown document below or upload a <code>.md</code> file. See the{' '}
        <button
          type="button"
          onClick={() => setShowTemplate((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'steelblue',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          template
        </button>{' '}
        for the expected shape. Imports run in a single transaction — partial imports are rejected.
      </p>

      {showTemplate && (
        <pre
          style={{
            background: '#f4f4f4',
            padding: '0.5rem',
            maxHeight: '20rem',
            overflow: 'auto',
            fontSize: '0.85rem',
          }}
        >
          {TEMPLATE_SAMPLE}
        </pre>
      )}

      <p>
        <label htmlFor="import-file">Upload .md file: </label>
        <input
          id="import-file"
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={(e) => void onFile(e)}
        />
      </p>

      <p>
        <label htmlFor="import-markdown">Markdown</label>
        <br />
        <textarea
          id="import-markdown"
          rows={20}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />
      </p>

      <button
        type="button"
        onClick={() => void onImport()}
        disabled={busy || markdown.trim() === ''}
      >
        {busy ? 'Importing…' : 'Import'}
      </button>

      {success && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#e6f7e6' }}>
          <p>
            <strong>Imported.</strong>{' '}
            <Link to={`/scenarios/${success.scenarioId}`}>View scenario →</Link>
          </p>
          <ul>
            <li>Locations: {success.counts.locations}</li>
            <li>Factions: {success.counts.factions}</li>
            <li>NPCs: {success.counts.npcs}</li>
            <li>Items: {success.counts.items}</li>
            <li>Clues: {success.counts.clues}</li>
            <li>Scenes: {success.counts.scenes}</li>
            <li>Edges: {success.counts.edges}</li>
          </ul>
        </div>
      )}

      {errors && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fff0f0' }}>
          <p>
            <strong>Validation errors ({errors.length}):</strong>
          </p>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>
                line {e.line}, field <code>{e.field}</code>: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {transportError && (
        <p style={{ color: 'crimson', marginTop: '1rem' }}>Failed: {transportError}</p>
      )}
    </section>
  )
}

export default ImportPage
