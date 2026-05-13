# pi-smart

Context optimization and intelligence extension for coding agents.

## Features

- **Goal Analyzer** - Intent detection and task decomposition
- **Token Compression** - Multi-level compression (lite/full/ultra/wenyan)
- **Hook System** - Blocking and non-blocking hooks
- **I18n Support** - 5 locales (en, es, fr, pt-BR, vi)
- **BM25 Search** - Full-text search with relevance scoring
- **Sandbox Analysis** - Safe code analysis environment
- **Learn Command** - Interactive documentation learning

## Installation

```bash
npm install pi-smart
```

## Usage

### Commands

- `/learn [topic]` - Learn about topic
- `/search [query]` - Search knowledge base
- `/compress [level]` - Compress output (lite/full/ultra/wenyan)
- `/analyze [code]` - Analyze code in sandbox

### Goal Analyzer

```typescript
import { analyzeGoal } from 'pi-smart';

const result = analyzeGoal("Implement user authentication");
console.log(result.intent);      // 'implement'
console.log(result.complexity); // 'medium'
console.log(result.roles);      // ['executor', 'reviewer']
```

### Caveman Mode Compression

```typescript
import { compressText, CavemanLevel } from 'pi-smart';

const result = compressText(
  "I would recommend using useMemo here for optimization",
  "full"
);
// Result: "use useMemo for optimization" (~50% reduction)
```

## Architecture

```
src/
├── intent/
│   └── goal-analyzer.ts   # Intent detection
├── compress/
│   └── caveman-mode.ts    # Token compression
├── i18n/
│   └── translations.ts    # 5 locales
├── search/
│   └── bm25.ts            # BM25 search
├── sandbox/
│   └── sandbox.ts         # Safe execution
└── index.ts
```

## Patterns Applied

- Goal analyzer from pi-crew team-recommendation
- Hook system from pi-crew
- I18n from pi-crew
- BM25 search from context-mode
- Caveman mode from caveman project

## License

MIT
