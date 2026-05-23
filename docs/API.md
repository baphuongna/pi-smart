# pi-smart API Reference

## Extension Setup

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerPiSmart } from "pi-smart";

export default function (pi: ExtensionAPI): void {
  registerPiSmart(pi);
}
```

## Tools

The extension registers the following tools when loaded:

### analyze

Execute code in a sandboxed environment for data analysis.

```typescript
// Parameters
{
  language: "javascript" | "typescript" | "python" | "shell";
  code: string;
  intent?: string;           // Optional: what we're looking for
  maxOutputBytes?: number;   // Default: 5120
  allowNetwork?: boolean;   // Default: false
}

// Returns
{
  content: [{ type: "text", text: string }];
  details: { bytesProcessed: number; bytesReturned: number };
}
```

### smart_config

Get or set pi-smart runtime configuration.

```typescript
// Parameters
{
  action: "get" | "set" | "reset";
  key: string;
  value?: any;  // For 'set' action
}

// Supported keys for 'get':
// - intensity           Returns: "terse" | "normal" | "verbose"
// - filters.enabled     Returns: "true" | "false"
// - budget.thresholds   Returns: JSON object

// Supported keys for 'set':
// - intensity           Values: "terse", "normal", "verbose"
// - filters.enabled     Values: true, false
```

## Hooks

pi-smart integrates with the following hooks:

| Hook | Purpose |
| --- | --- |
| `session_start` | Initialize config, cost tracker, budget state |
| `session_shutdown` | Clean up session state |
| `message_end` | Compress assistant responses |
| `tool_result` | Filter tool output |
| `turn_end` | Check budget and auto-compact |
| `before_agent_start` | Inject steering messages |
| `pre_task`, `post_task` | Task lifecycle (via hook system) |

## Configuration

Configuration is loaded from `.pi-smart.json` in the project root:

```json
{
  "enabled": true,
  "compression": {
    "enabled": true,
    "intensity": "normal",
    "autoIntensify": true
  },
  "filters": {
    "enabled": true
  },
  "budget": {
    "enabled": true,
    "thresholds": {
      "high": 0.6,
      "critical": 0.8,
      "emergency": 0.95
    }
  },
  "cost": {
    "showWidget": false
  },
  "analyze": {
    "enabled": true,
    "maxOutputBytes": 5120,
    "allowNetwork": false,
    "timeout": 30000
  }
}
```

## Internal Modules

These are available for internal use but not part of the public API:

### Token Compressor

```typescript
import { compressByIntensity, TokenCompressor } from "pi-smart/src/compress/caveman";
```

### Output Filters

```typescript
import { applyPipeline } from "pi-smart/src/filter/pipeline";
import { resolveProfile } from "pi-smart/src/filter/config";
```

### Budget Management

```typescript
import { computeBudgetState, getSteeringMessage, shouldAutoCompact } from "pi-smart/src/budget/state-machine";
import { calculatePercentage } from "pi-smart/src/budget/tracker";
```

### Hook System

```typescript
import { createHookSystem, LIFECYCLE_HOOKS, type HookName } from "pi-smart/src/hooks/hook-system";
```

### Sandbox

```typescript
import { executeInSandbox } from "pi-smart/src/analyze/sandbox";
```

## Events

pi-smart emits the following events via the event bus:

```typescript
// See src/events/event-bus.ts for full event definitions
```