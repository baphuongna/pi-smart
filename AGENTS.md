# pi-smart Agent Operating Guide

## Extension Purpose

pi-smart provides intelligent context optimization, token compression, and code indexing for Pi coding agents.

## Source Of Truth

1. `README.md` - Extension overview
2. `skills/smart-context/SKILL.md` - Context optimization skill
3. `skills/analyze-first/SKILL.md` - Data analysis skill
4. `docs/HARNESS.md` - Operating model
5. `docs/FEATURE_INTAKE.md` - Intake process
6. `docs/product/` - Product contracts
7. `docs/stories/` - Story packets
8. `docs/TEST_MATRIX.md` - Proof status
9. `docs/decisions/` - Decision records

## Extension Capabilities

### Core Tools
- `analyze` - Execute code in sandbox for data processing
- `smart_config` - Get or set pi-smart runtime configuration

### Skills
- `skills/smart-context/SKILL.md` - Context optimization, BM25 search, token compression
- `skills/analyze-first/SKILL.md` - Analyze tool usage for data processing

## When to Use This Extension

- Context getting too large
- Need to find relevant code quickly
- Token optimization
- Data analysis and counting

## Validation Commands

```bash
npm test
npm run lint
npx tsc --noEmit
```
