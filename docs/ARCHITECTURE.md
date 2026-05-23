# Architecture

## Extension Structure

```
pi-smart/
├── src/
│   ├── aggregate/        # Message aggregation
│   ├── advisor/         # Context optimization advisor
│   ├── analyze/         # Sandbox execution
│   ├── budget/          # Budget state machine & tracking
│   ├── compress/        # Token compression (caveman mode)
│   ├── concurrency/     # Semaphore, mutex primitives
│   ├── config.ts        # Configuration management
│   ├── cost/            # Cost tracking & pricing
│   ├── events/          # Internal event bus
│   ├── extension/       # Pi extension registration
│   ├── filter/          # Output filtering pipeline
│   ├── governance/      # Policy-based governance
│   ├── hooks/           # Hook system & governance
│   ├── i18n/            # Internationalization
│   ├── index/           # Module exports
│   ├── intent/          # Intent resolution
│   ├── learn/           # Pattern learning
│   ├── memory/          # Memory & failure injection
│   ├── observability/   # Metrics collection
│   ├── office/          # Office hours scheduling
│   ├── optimize/        # Memoization
│   ├── permission/      # Command permissions
│   ├── sandbox/         # Sandbox management
│   ├── search/          # BM25 search
│   └── filter/
│       └── filters/     # Individual filter implementations
├── skills/              # pi-crew skills
│   ├── pi-smart/        # pi-smart skill suite
│   ├── grill-me/        # Context analysis skill
│   └── master/          # Master agent skills
├── test/
│   └── unit/            # Unit tests
└── docs/
    ├── stories/          # User stories
    ├── decisions/        # Architecture decisions
    └── product/          # Product contracts
```

## Core Components

| Component | Purpose |
| --- | --- |
| Extension Registration | Initialize pi-smart with Pi coding agent |
| Token Compressor | Caveman-style 50-75% token reduction |
| Output Filter Pipeline | ANSI strip, blank collapse, path shortening, stack trace collapse |
| Budget State Machine | NORMAL → HIGH → CRITICAL → EMERGENCY transitions |
| Cost Tracker | Session cost and token tracking |
| Analyze Tool | Sandboxed code execution for data analysis |
| Hook System | Lifecycle event registration and triggering |
| Governance Engine | Policy-based behavior enforcement |

## Data Flow

```
Pi Coding Agent
    │
    ├── session_start ──► Config + Budget + Cost Tracker initialized
    │
    ├── User Prompt ──► before_agent_start ──► Steering injection
    │
    ├── Tool Result ──► Filter Pipeline ──► Token Compressor ──► Filtered output
    │
    ├── Assistant Response ──► message_end ──► Caveman compression
    │
    ├── turn_end ──► Budget check ──► Auto-compact if needed
    │
    └── analyze tool ──► Sandbox execution ──► Sized output
```

## Hook System

The hook system provides lifecycle event handling:

| Hook | Direction | Purpose |
| --- | --- | --- |
| session_start | inbound | Initialize session state |
| session_shutdown | inbound | Clean up resources |
| message_end | inbound | Compress responses |
| tool_result | inbound | Filter tool output |
| turn_end | inbound | Budget monitoring |
| before_agent_start | inbound | Steering injection |
| pre_task | both | Pre-task validation |
| post_task | both | Post-task processing |

## Configuration Hierarchy

1. Default config (embedded in `config.ts`)
2. Project `.pi-smart.json` (merged)
3. Environment variables (overrides)
4. Runtime `smart_config` tool (runtime overrides)

## Dependencies

- `@earendil-works/pi-coding-agent` - Pi extension API
- TypeScript with strict mode
- Node.js built-in modules: `vm`, `crypto`, `path`, `fs`