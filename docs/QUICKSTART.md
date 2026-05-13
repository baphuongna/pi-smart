# Quick Start - pi-smart

## Installation

```bash
pi install npm:pi-smart
```

## Basic Usage

### 1. Enable Compression

```bash
# Set to terse mode (max compression)
/smart-intensity terse

# Set to normal mode
/smart-intensity normal

# Set to verbose mode (no compression)
/smart-intensity verbose
```

### 2. Configure Filters

```bash
# Enable/disable specific filters
smart_config action="set" key="filters.stripAnsi" value="true"
smart_config action="set" key="filters.collapseBlanks" value="true"
```

### 3. Check Costs

```bash
# View total cost
smart_config action="get" key="cost.total"

# View per-model cost
smart_config action="get" key="cost.byModel"

# Reset cost counter
smart_config action="reset" key="cost"
```

### 4. Analyze Data

Instead of reading 50 files, write a script:

```bash
# Analyze JavaScript/TypeScript
analyze language="javascript" code="
const files = ['file1.ts', 'file2.ts'];
console.log(files.length);
"

# Analyze Python
analyze language="python" code="print('hello')"

# Analyze Shell
analyze language="shell" code="ls -la | wc -l"
```

## Compression Levels

### Terse Mode
- Maximum compression
- Shortens paths
- Collapses whitespace
- Removes ANSI codes
- ~75% size reduction

### Normal Mode
- Balanced compression
- Preserves readability
- ~50% size reduction

### Verbose Mode
- No compression
- Full context preserved
- Useful for debugging

## Filter Types

| Filter | Description |
|--------|-------------|
| `stripAnsi` | Remove ANSI color codes |
| `collapseBlanks` | Collapse multiple blank lines |
| `shortenPaths` | Shorten file paths |
| `truncate` | Truncate long outputs |
| `headTail` | Keep first/last N lines |

## Budget Tracking

```bash
# Set budget thresholds (percentages)
smart_config action="set" key="budget.thresholds" value="[60, 80, 90]"

# When budget exceeded, compression auto-intensifies
```
