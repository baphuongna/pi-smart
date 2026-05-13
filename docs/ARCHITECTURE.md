# Architecture

## Extension Structure

```
pi-smart/
├── src/
│   ├── extension/        # Pi extension registration
│   ├── compress/         # Token compression
│   ├── filter/           # Output filtering
│   ├── cost/             # Cost tracking
│   ├── analyze/          # Analyze tool
│   └── config.ts         # Configuration
├── skills/               # pi-crew skills
├── test/
│   └── unit/             # Unit tests
└── docs/
    └── product/           # Product contracts
```

## Core Components

| Component | Purpose |
| --- | --- |
| Token Compressor | Caveman-style ~75% reduction |
| Output Filter | ANSI strip, blank collapse, path shorten |
| Cost Tracker | Token and API cost tracking |
| Analyze Tool | Script-based data analysis |

## Dependencies

- `@earendil-works/pi-coding-agent` - Pi extension API
- TypeScript with strict mode
