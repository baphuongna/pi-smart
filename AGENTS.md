# pi-smart Agent Operating Guide

## Extension Purpose

pi-smart provides context optimization, token compression, output filtering, and cost tracking for Pi coding agents. It helps manage context window usage and reduce costs.

## Source Of Truth

1. `README.md` for extension overview.
2. `docs/HARNESS.md` for the human-agent operating model.
3. `docs/FEATURE_INTAKE.md` before turning any request into work.
4. `docs/ARCHITECTURE.md` before proposing implementation changes.
5. `docs/product/` for current product contracts.
6. `docs/stories/` for story packets and backlog.
7. `docs/TEST_MATRIX.md` for proof status.
8. `docs/decisions/` for why important choices were made.

## Extension Capabilities

### Core Tools
- `smart_config` - Runtime configuration management
- `analyze` - Write scripts to analyze data
- `token_compressor` - Caveman-style compression
- `output_filter` - Strip ANSI, collapse blanks, shorten paths

### Commands
- `/smart-intensity` - Set compression intensity
- `/smart-filters` - Configure output filters
- `/smart-budget` - Set context budget thresholds
- `/smart-cost` - Show cost tracking

## Validation Commands

```bash
npm test                    # Unit tests
npm run lint               # Lint checks
npx tsc --noEmit          # TypeScript type check
```

## Done Definition

A task is done when:
- The requested change is completed or the blocker is documented.
- Relevant docs, stories, and test matrix entries remain current.
- Validation commands were run when they exist.
- Missing harness capabilities were added to `docs/HARNESS_BACKLOG.md`.
