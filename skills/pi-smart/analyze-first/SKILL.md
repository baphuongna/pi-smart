---
name: analyze-first
description: Use analyze tool for data processing instead of manual file reading
triggers:
  - count
  - analyze
  - filter
  - process data
  - calculate
  - statistics
  - find all
  - how many
  - list all
requirements:
  tools: [analyze]
---

# Analyze First Skill

## Objective
Use the analyze tool for data processing instead of reading files manually.

## Tools Available
- `analyze` - Execute code in sandbox for analysis

## When to Use
- When you need to count files, functions, lines
- When you need to find patterns in code
- When you need to calculate statistics
- When processing large amounts of data

## Rule
**NEVER read 50 files into context to count functions**
**INSTEAD use `analyze({ language: "javascript", code: "..." })`**

## Usage

```javascript
analyze({
  language: "javascript" | "typescript" | "python" | "shell",
  code: "your code here",
  intent: "what we're looking for"
})
```

## Examples

### Count TypeScript Files
```
analyze({ 
  language: "javascript", 
  code: "const fs=require('fs'); fs.readdirSync('src').filter(f=>f.endsWith('.ts')).forEach(f=>console.log(f+': '+fs.readFileSync('src/'+f,'utf8').split('\\n').length+' lines'))"
})
```

### Find TODO Comments
```
analyze({ 
  language: "shell", 
  code: "grep -rn TODO src/ || true"
})
```

### Count Functions per File
```
analyze({
  language: "javascript",
  code: "const fs=require('fs'); const path=require('path'); fs.readdirSync('src',{recursive:true}).filter(f=>f.endsWith('.ts')).forEach(f=>{const c=fs.readFileSync(path.join('src',f),'utf8');const m=c.match(/function\\s+\\w+|const\\s+\\w+\\s*=/g);console.log(f+': '+(m?m.length:0))})"
})
```

### Analyze Dependencies
```
analyze({
  language: "shell",
  code: "cat package.json | grep dependencies | wc -l"
})
```

## Sandbox Environment
- No network access by default
- Output truncated to 5KB
- Supports JavaScript, TypeScript, Python, shell

## Tips
1. Use `console.log()` for output
2. Keep code concise
3. Handle errors gracefully (`|| true` for grep)
4. Use shell for simple text processing

## Integration with pi-recollect

### Store Analysis Results

```typescript
// After finding patterns
memory_store({
  category: "analysis",
  title: "Complex function detected",
  content: `File: src/auth/login.ts
Function: authenticate()
Complexity: 15 (threshold: 10)
Suggestion: Split into smaller functions`,
  metadata: { 
    type: "complexity",
    value: 15
  }
})
```

### Before Analyzing

```typescript
memory_search({
  query: "complexity auth login",
  maxResults: 3
})
```

### Why This Matters

- Agent remembers "this file has complexity issues"
- Skip re-analyzing known issues
- Focus on new problems

## Cross-Extension Integration

### With pi-pipeline (Optimize Pipeline)

```typescript
// Analyze codebase
analyze({ files: "src/**/*.ts", intent: "complexity" })

// Optimize context
smart_config({ action: "set", key: "focus", value: "complex-files" })

// Run pipeline
pipeline_verify()
```

### With pi-langsrv (Structure Analysis)

```typescript
// Get structure
lsp_symbols({ file: "src/**/*.ts" })

// Analyze
analyze({ symbols: symbols, intent: "refactor" })
```

### With pi-recollect (Store Analysis)

```typescript
// Analyze code
analyze({ files: "src/**/*.ts", intent: "patterns" })

// Store patterns found
memory_store({
  category: "pattern",
  title: "Complex functions found",
  content: "3 functions with complexity > 15"
})
```
