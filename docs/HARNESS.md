# Harness

pi-smart is a context optimization extension for Pi coding agents.

## Mental Model

```text
User intent
    |
    v
Feature intake (classify risk)
    |
    v
Story packet (if needed)
    |
    v
Agent work loop
    |
    v
Product delta (code, tests, docs)
    |
    v
Validation proof (tests pass)
    |
    v
Harness delta (update docs, backlog)
```

## Input Types

| Type | Use when | Typical artifact |
| --- | --- | --- |
| New filter | Adding new output filter | Story packet |
| Compression improve | Better token reduction | Story packet |
| Cost tracking | New cost metrics | Story packet |
| Harness improvement | Process changes | `docs/HARNESS_BACKLOG.md` |

## Validation Ladder

```text
validate:quick
  format, lint, typecheck, unit tests
```

## Growth Rule

When an agent finds confusion, missing rules, or recurring patterns, improve the harness directly or add to `HARNESS_BACKLOG.md`.

## Key Components

| Component | Purpose |
| --- | --- |
| Token Compression | Caveman-style compression (~75% reduction) |
| Output Filtering | Strip ANSI, collapse blanks, shorten paths |
| Cost Tracking | Track token usage and API costs |
| Analyze Tool | Script-based data analysis |
