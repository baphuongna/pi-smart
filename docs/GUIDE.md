# User Guide - pi-smart

## Overview

pi-smart optimizes context usage in Pi coding agents through compression, filtering, and cost tracking.

## Compression System

### How It Works

1. Tool outputs are captured
2. Filters are applied based on intensity
3. Compressed output replaces original
4. Context budget is updated

### Intensity Levels

```javascript
// Terse - Maximum compression
{
  intensity: "terse",
  filters: ["stripAnsi", "collapseBlanks", "shortenPaths", "truncate"],
  truncateLength: 500
}

// Normal - Balanced
{
  intensity: "normal",
  filters: ["stripAnsi", "collapseBlanks"],
  truncateLength: 2000
}

// Verbose - No compression
{
  intensity: "verbose",
  filters: [],
  truncateLength: 0
}
```

### Auto-Intensify

When context budget reaches thresholds, intensity auto-adjusts:

- 60% → normal → terse
- 80% → verbose → normal
- 90% → aggressive terse

## Analyze Tool

### Language Support

```javascript
// JavaScript/TypeScript
analyze language="javascript" code="..." intent="..."

// Python
analyze language="python" code="..." intent="..."

// Shell
analyze language="shell" code="..." intent="..."
```

### Use Cases

#### Count Functions
```javascript
analyze language="javascript" code="
const fs = require('fs');
const content = fs.readFileSync('src/index.ts', 'utf8');
const matches = content.match(/function\s+\w+/g);
console.log(matches ? matches.length : 0);
" intent="Count functions in src/index.ts"
```

#### Analyze Project Structure
```javascript
analyze language="shell" code="
find src -name '*.ts' | wc -l
" intent="Count TypeScript files"
```

### Safety

The analyze tool:
- Runs in sandboxed environment
- Has timeout limits (default 5s)
- No network access
- Limited file system access

## Cost Tracking

### Configure Pricing

```javascript
smart_config action="set" key="cost.pricing" value="{
  'MiniMax-M2.7': { input: 0.1, output: 0.3 },
  'claude-3.5': { input: 0.5, output: 1.5 }
}"
```

### View Costs

```javascript
// Total cost
smart_config action="get" key="cost.total"

// By model
smart_config action="get" key="cost.byModel"

// By session
smart_config action="get" key="cost.bySession"
```

## Correction Detection

Detects when agent makes corrections mid-turn:

```javascript
// Enable
smart_config action="set" key="correction.enabled" value="true"

// View corrections
smart_config action="get" key="correction.count"
```

## Failure Injection

For testing robustness:

```javascript
// Inject random failure
smart_config action="set" key="failure.rate" value="0.1"

// Inject specific failure
smart_config action="set" key="failure.type" value="timeout"
```

## Best Practices

1. **Start with normal** - Adjust based on context usage
2. **Use analyze tool** - Instead of reading large files
3. **Monitor costs** - Track spending in large projects
4. **Set budgets** - Prevent runaway context growth
