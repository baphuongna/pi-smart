# Configuration - pi-smart

## Configuration File

Create `pi-smart.config.json`:

```json
{
  "compression": {
    "intensity": "normal",
    "filters": {
      "enabled": true,
      "stripAnsi": true,
      "collapseBlanks": true,
      "shortenPaths": true,
      "truncate": 2000,
      "headTail": { "head": 100, "tail": 50 }
    }
  },
  "budget": {
    "thresholds": [60, 80, 90],
    "autoIntensify": true,
    "current": 0
  },
  "cost": {
    "tracking": true,
    "pricing": {
      "MiniMax-M2.7": { "input": 0.1, "output": 0.3 },
      "claude-3.5": { "input": 0.5, "output": 1.5 }
    },
    "total": 0
  },
  "analyze": {
    "timeout": 5000,
    "allowNetwork": false,
    "maxOutputBytes": 5120
  },
  "correction": {
    "enabled": false,
    "count": 0
  },
  "failure": {
    "enabled": false,
    "rate": 0,
    "type": "random"
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PI_SMART_INTENSITY` | Default intensity | normal |
| `PI_SMART_TIMEOUT` | Analyze timeout | 5000 |
| `PI_SMART_TRACK_COST` | Enable cost tracking | true |

## Per-Command Config

Override settings per command:

```bash
/smart-intensity terse --temp
```

## Filter Configuration

### Strip ANSI
```json
"filters.stripAnsi": true
```

### Collapse Blanks
```json
"filters.collapseBlanks": true
```

### Shorten Paths
```json
"filters.shortenPaths": true
```
Replaces:
- `/home/user/project/src/` → `src/`
- `/home/user/project/` → `./`

### Truncate
```json
"filters.truncate": 1000
```

### Head/Tail
```json
"filters.headTail": {
  "head": 50,
  "tail": 20
}
```

## Budget Configuration

```json
"budget": {
  "thresholds": [50, 70, 85, 95],
  "autoIntensify": true
}
```

## Cost Configuration

```json
"cost": {
  "tracking": true,
  "pricing": {
    "model-name": {
      "input": 0.01,    // per 1K tokens
      "output": 0.03
    }
  }
}
```
