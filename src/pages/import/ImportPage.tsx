import { useState } from 'react'
import { Link } from 'react-router'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Field from '../../components/ui/Field'
import Heading from '../../components/ui/Heading'
import Inline from '../../components/ui/Inline'
import Input from '../../components/ui/Input'
import Stack from '../../components/ui/Stack'
import Textarea from '../../components/ui/Textarea'
import Toolbar from '../../components/ui/Toolbar'

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
    <Stack gap="md">
      <Heading level={1}>Import scenario</Heading>
      <Card>
        <Stack gap="md">
          <p>
            Paste a scenario Markdown document below or upload a <code>.md</code> file. See the{' '}
            <Button variant="ghost" size="sm" onClick={() => setShowTemplate((v) => !v)}>
              template
            </Button>{' '}
            for the expected shape. Imports run in a single transaction — partial imports are
            rejected.
          </p>

          {showTemplate && (
            <Card>
              <pre>{TEMPLATE_SAMPLE}</pre>
            </Card>
          )}

          <Field label="Upload .md file">
            <Input
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              onChange={(e) => void onFile(e)}
            />
          </Field>

          <Field label="Markdown">
            <Textarea rows={20} value={markdown} onChange={(e) => setMarkdown(e.target.value)} />
          </Field>

          <Toolbar align="start">
            <Button
              variant="primary"
              onClick={() => void onImport()}
              disabled={busy || markdown.trim() === ''}
            >
              {busy ? 'Importing…' : 'Import'}
            </Button>
          </Toolbar>
        </Stack>
      </Card>

      {success && (
        <Card>
          <Stack gap="sm">
            <Inline gap="sm">
              <Badge variant="ok">Imported</Badge>
              <Link to={`/scenarios/${success.scenarioId}`}>View scenario →</Link>
            </Inline>
            <ul>
              <li>Locations: {success.counts.locations}</li>
              <li>Factions: {success.counts.factions}</li>
              <li>NPCs: {success.counts.npcs}</li>
              <li>Items: {success.counts.items}</li>
              <li>Clues: {success.counts.clues}</li>
              <li>Scenes: {success.counts.scenes}</li>
              <li>Edges: {success.counts.edges}</li>
            </ul>
          </Stack>
        </Card>
      )}

      {errors && (
        <Card>
          <Stack gap="sm">
            <Heading level={2}>Validation errors ({errors.length})</Heading>
            <ul>
              {errors.map((e, i) => (
                <li key={i}>
                  <Inline gap="sm">
                    <Badge variant="danger">line {e.line}</Badge>
                    <Badge variant="neutral">{e.field}</Badge>
                    <span>{e.message}</span>
                  </Inline>
                </li>
              ))}
            </ul>
          </Stack>
        </Card>
      )}

      {transportError && <p>Failed: {transportError}</p>}
    </Stack>
  )
}

export default ImportPage
