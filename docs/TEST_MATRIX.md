# Test Matrix

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |

## Matrix

| Story | Tool/Feature | Unit | Integration | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| US-001 | smart_config tool | yes | no | implemented | test/unit/config.test.ts |
| US-002 | token_compressor | yes | no | implemented | test/unit/compressor.test.ts |
| US-003 | output_filter | yes | no | implemented | test/unit/filter.test.ts |
| US-004 | cost_tracking | yes | no | implemented | test/unit/cost.test.ts |
| US-005 | analyze tool | yes | no | implemented | test/unit/analyze.test.ts |

## Validation Commands

```bash
npm test           # Run all unit tests
npm run lint       # Lint checks
npx tsc --noEmit   # TypeScript type check
```
