---
name: smart-context
description: Intelligent context aggregation with BM25 search, token compression, and code indexing
triggers:
  - analyze
  - smart context
  - what is the context
  - search context
  - code index
  - optimize context
  - token limit
requirements:
  tools: [analyze, smart_config]
  context: [project files]
---

# Smart Context Skill

## Objective
Optimize context management through intelligent compression, BM25 search, and code indexing.

## Tools Available
- `analyze` - Execute code in sandbox for data processing and analysis
- `smart_config` - Get or set pi-smart runtime configuration

## When to Use
- When context is getting too large
- When you need to find relevant code quickly
- When you want to optimize token usage
- When searching for specific patterns in code

## Core Features

### 1. Analyze Tool
Execute code without using tool calls:

```
analyze({
  language: "javascript",
  code: "...",
  intent: "what we're looking for"
})
```

Use cases:
- Count files, functions, lines
- Find patterns in code
- Calculate statistics
- Filter and process data

### 2. Smart Config
Configure pi-smart behavior:

```
smart_config({ action: "get", key: "context.limit" })
smart_config({ action: "set", key: "context.limit", value: 8000 })
```

### 3. Token Compression
When context exceeds limits:
1. Analyze current context usage
2. Identify compression opportunities
3. Apply caveman-mode or custom rules
4. Verify compression quality

## Examples

### Count Functions
```
analyze({ 
  language: "javascript", 
  code: "const fs=require('fs'); Object.keys(JSON.parse(fs.readFileSync('package.json','utf8')).dependencies).forEach(d=>console.log(d))",
  intent: "list dependencies"
})
```

### Find TODO Comments
```
analyze({ 
  language: "shell", 
  code: "grep -rn TODO src/ || true",
  intent: "find TODO comments"
})
```

### Optimize Context
```
User: Context is too large
Agent:
  1. analyze({ language: "shell", code: "wc -c context.txt" })
  2. smart_config({ action: "set", key: "compression.enabled", value: true })
```

## Configuration Keys

| Key | Description | Default |
|-----|-------------|---------|
| context.limit | Max context size in tokens | 10000 |
| context.compression | Enable compression | true |
| analyze.timeout | Analyze tool timeout (ms) | 5000 |

## BM25 Search
BM25-weighted full-text search for finding relevant code:
- Used by memory_search
- Weighted by term frequency
- Includes proximity scoring
