# Labels

Labels are applied via the front-matter `labels:` array on each issue. Keep the set small — these are facets for filtering, not categories for taxonomy.

## Area

| Label | Description |
|---|---|
| `scaffold` | Repo bootstrap, tooling, CI, and one-time project plumbing |
| `domain` | Pure-TS domain logic (DG mechanics, parsers, serializers) — independent of React and Drizzle |
| `ui` | React components, forms, lists, detail pages, mode toggles |
| `search` | Cmd-K palette, in-memory index, list-view filtering |
| `ops` | Hosting, deploys, env config, backups, recovery rehearsals |

## Type

| Label | Description |
|---|---|
| `data-model` | Schema design, Drizzle migrations, entity definitions, typed-edge tables |
| `import-export` | MD scenario import, per-entity MD export, campaign archive, player handouts |
| `performance` | Latency targets and budget enforcement (Cmd-K <1s, page nav <500ms) |
| `testing` | Vitest coverage, cross-browser smoke, live-session run-through |
