---
name: smart-context
description: Intelligent context aggregation with BM25 search, sandbox execution, and code indexing
triggers:
  - analyze
  - smart context
  - what is the context
  - search context
  - code index
requirements:
  tools: [read, write, bash]
  context: [current project files]
---

# Smart Context Skill

## Objective
Aggregate intelligent context from recent changes, code index, and decisions using BM25 search, sandbox execution, and fast code indexing.

## When to Use
- When user asks "what's the current context" or "analyze this code"
- When you need to find relevant code across the project
- When executing code analysis without multiple file reads
- When searching for decisions or patterns

## Workflow

### Step 1: Add Context
```typescript
// Add files to context
smartContext.addFile('src/api.ts', fileContent);

// Add decisions
smartContext.addDecision('Use JWT for auth', 'More scalable than sessions');

// Add errors
smartContext.addError('TypeError: Cannot read property', 'When calling user.getName()');
```

### Step 2: Query Context
```typescript
// Natural language query
const result = await smartContext.query({ 
  query: "authentication implementation" 
});

// Get recent entries
const recent = smartContext.recent(10);

// Get only decisions
const decisions = smartContext.decisions(5);
```

### Step 3: Execute Analysis
```typescript
// Run code in sandbox
const result = await smartContext.execute(`
  const symbols = ['auth', 'login', 'verify'];
  symbols.filter(s => s.includes('auth'));
`);

// Analyze code structure
const analysis = smartContext.analyze(code);
// Returns: { functions, classes, imports, exports }
```

### Step 4: Index Codebase
```typescript
// Index project for fast lookup
const index = new CodeIndex();
await index.indexProject('/path/to/project');

// Find definition
const def = index.findDefinition('authenticate');
// Returns: { name, type, file, line }

// Find all references
const refs = index.findReferences('authenticate');
// Returns: all places where authenticate is used

// Get call graph
const graph = index.getCallGraph('processRequest');
// Returns: { caller, callees: [...] }
```

## Output Format

### Context Result
```json
{
  "entries": [
    {
      "type": "decision",
      "content": "Use JWT for authentication",
      "timestamp": 1699999999999,
      "source": "src/auth.ts"
    }
  ],
  "tokens": 1250,
  "sources": ["src/auth.ts", "src/api.ts"]
}
```

### Code Index Result
```json
{
  "symbols": [
    {
      "name": "authenticate",
      "type": "function",
      "file": "src/auth.ts",
      "line": 42
    }
  ],
  "callGraph": [...],
  "files": 150,
  "indexTime": 2340
}
```

## Examples

### Query for Authentication
```
User: What decisions have we made about authentication?
Agent:
  const decisions = smartContext.decisions(10);
  // Filter for auth-related
  const authDecisions = decisions.entries.filter(
    e => e.content.toLowerCase().includes('auth')
  );
```

### Index and Search
```
User: Where is the authenticate function defined?
Agent:
  const def = codeIndex.findDefinition('authenticate');
  // Returns location
```

### Sandbox Execution
```
User: Test this regex pattern: /^[a-z]+$/
Agent:
  const result = await smartContext.execute(`
    const pattern = /^[a-z]+$/;
    return {
      test1: pattern.test('hello'),
      test2: pattern.test('Hello123')
    };
  `);
  // Returns: { test1: true, test2: false }
```

## Performance

- **Code Index**: Indexes ~1000 files in ~2 seconds
- **BM25 Search**: Sub-millisecond for in-memory search
- **Sandbox**: 5 second timeout, 128MB memory limit

## Integration

### With pi-recollect
```typescript
// Get memories from pi-recollect
const memories = await pi_recollect_query({ query: "auth" });

// Add to smart context
for (const mem of memories) {
  smartContext.add({
    type: 'decision',
    content: mem.value,
    timestamp: mem.createdAt
  });
}
```

### With pi-langsrv
```typescript
// Use pi-langsrv for accurate symbol resolution
const lsp = new LanguageIntelligence();
const refs = await lsp.findReferences('authenticate', 'typescript');
```
