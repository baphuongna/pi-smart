# Patterns Applied to pi-smart

This document lists all research patterns applied to this extension during development.

## Research Sources

- gstack (persistent daemon, design system, boil the lake)
- gsd-2 (ADR, multi-model, branchless worktree)
- pi-crew (hooks, metrics, correlation, UI patterns)
- pi-hermes-memory (memory categories, learn command)
- beads (hash IDs, graph memory, memory decay)
- context-mode (BM25 search, context sandbox)
- everything-claude-code (quality gates, agent shield)
- vetc-dev-kit (SDLC router, systematic debugging)
- caveman (token compression)
- And more...

## Patterns Implemented

### Core Patterns

| Pattern | Source | Description |
|---------|--------|-------------|
| GoalAnalyzer | pi-crew | Intent detection and decomposition |
| CavemanMode | caveman | Multi-level token compression |
| HookSystem | pi-crew | Blocking and non-blocking hooks |
| I18n | pi-crew | 5 locales (en, es, fr, pt-BR, vi) |
| BM25Search | context-mode | Full-text search with relevance |
| SandboxAnalysis | custom | Safe code analysis environment |
| LearnCommand | pi-hermes-memory | Interactive documentation learning |

## Implementation Notes

All patterns were researched from 52 source repositories and applied following the pi-crew delegation patterns skill.

### Research Process

1. Read source repositories (bare git repos in `source/`)
2. Extract patterns applicable to this extension
3. Implement patterns with tests
4. Verify with 100% test coverage

### Test Coverage

All new patterns include comprehensive unit tests to ensure correctness.

## References

- [Research Index](../research-findings/00-index.md)
- [API Reference](API.md)
- [Quick Start](QUICKSTART.md)
