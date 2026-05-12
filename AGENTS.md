# pi-smart Development Notes

Pi extension for output filtering, compression, analyze tool, and cost tracking.

## Rules

- Keep `index.ts` minimal; register functionality from `src/extension/register.ts`.
- Prefer small modules over large orchestrator files.
- Avoid `any`; use `unknown` plus validation for tool/config inputs.
- Filter pipeline must be safe: skip on error, log, pass through.
- Sandbox execution must strip dangerous env vars, block network by default, enforce timeout.
- Budget state machine transitions must be explicit and configurable.
- After code changes, run `npm test` from `pi-smart/` unless explicitly told not to.

## Important commands

```bash
npm test
npm run typecheck
```

## Important paths

- `src/extension/register.ts` — main registration + hooks
- `src/filter/` — filter pipeline and 12 filters
- `src/compress/` — caveman compression engine
- `src/analyze/` — analyze tool + sandbox
- `src/budget/` — context budget state machine
- `src/cost/` — token cost tracking + pricing
- `src/config.ts` — config loader
