# pi-smart

Context optimization extension for Pi coding agent — output filtering, compression, cost tracking, and analyze tool.

## Features

- **Token Compression** - Caveman compression reduces output by ~75%
- **Output Filtering** - Strip ANSI, collapse blanks, path shortening
- **Cost Tracking** - Track token usage and API costs
- **Analyze Tool** - Write scripts to analyze data instead of reading into context
- **Correction Detection** - Detect when agent makes corrections mid-turn
- **Failure Injection** - Intentional failures for testing robustness
- **Smart Config** - Runtime configuration management

## Install

```bash
pi install npm:pi-smart
```

## Quick Start

### Enable Compression
```bash
/smart-intensity terse
```

### Check Costs
```bash
smart_config action="get" key="cost.total"
```

### Analyze Data
```bash
# Use analyze tool instead of reading files
# Write a script that console.logs the result
```

## Commands

| Command | Description |
|---------|-------------|
| `/smart-intensity` | Set compression intensity (terse/normal/verbose) |
| `/smart-filters` | Configure output filters |
| `/smart-budget` | Set context budget thresholds |
| `/smart-cost` | Show cost tracking |

## Tools

### smart_config
Runtime configuration.

```javascript
// Get value
smart_config action="get" key="intensity"

// Set value
smart_config action="set" key="filters.enabled" value="true"

// Reset to defaults
smart_config action="reset"
```

### analyze
Sandboxed code execution.

```javascript
analyze language="javascript" code="console.log('Hello')"
```

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `intensity` | string | normal | Compression level |
| `filters.enabled` | boolean | true | Enable filters |
| `budget.thresholds` | object | {60,80,90} | Budget thresholds |
| `cost.total` | number | 0 | Total cost |
| `analyze.timeout` | number | 5000 | Timeout ms |

## Verify

```bash
pi list
```

## License

MIT
