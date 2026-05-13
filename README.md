# pi-smart

Context optimization extension for Pi coding agent — output filtering, compression, cost tracking, and analyze tool.

## Features

- **Token Compression** - Caveman compression reduces output by ~75%
- **Output Filtering** - Strip ANSI, collapse blanks, path shortening
- **Cost Tracking** - Track token usage and API costs
- **Analyze Tool** - Write scripts to analyze data instead of reading into context
- **Correction Detection** - Detect when agent makes corrections mid-turn
- **Failure Injection** - Intentional failures for testing robustness

## Install

```bash
pi install npm:pi-smart
```

## Usage

### Enable Compression
```bash
/smart compress on
```

### Track Costs
```bash
/smart cost
```

### Analyze Data
```bash
# Use the analyze tool in your coding agent
# Instead of reading 50 files, write a script that console.logs the result
```

## Verify

```bash
pi list
```

## License

MIT
