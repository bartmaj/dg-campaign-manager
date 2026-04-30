---
id: 002
title: Wire Vercel deploy pipeline
milestone: M1
unit: M1 — Foundation
status: not-started
labels: [ops, scaffold]
req-ids: [REQ-N12, REQ-N03, INT-002]
---

# Wire Vercel deploy pipeline

## Narrative
**As** the Prepping GM
**I want** a Vercel project linked to the repo with preview deploys per branch and production on main
**So that** every push produces a live URL I can hit from the table

## Acceptance Criteria

```gherkin
Given a Vercel project linked to the GitHub repo
When I push to a branch
Then a preview URL is generated and reachable
When I merge to main
Then the production URL updates within minutes
And environment variables for Turso credentials are configured in Vercel
```

## REQ Traceability
- REQ-N12 — Vercel hosting (free-tier deployment target)
- REQ-N03 — Single-user access model (no interactive auth; URL secrecy + env-bound credentials)
- INT-002 — Vercel integration

## Implementation Notes

Single-user access model is implicit here — the URL is the access boundary; no auth UI.

## Dependencies

Blocked by #001.
