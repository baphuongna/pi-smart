# analyze-first

When you need to analyze, count, filter, compare, or process data:

1. Write a script that does the analysis
2. Use the `analyze` tool to execute it
3. `console.log()` only the answer

NEVER: Read 50 files into context to count functions
INSTEAD: Use `analyze({ language: "javascript", code: "..." })`

## Examples

Count lines in all TypeScript files:
```
analyze({ language: "javascript", code: "const fs=require('fs'); fs.readdirSync('src').filter(f=>f.endsWith('.ts')).forEach(f=>console.log(f+': '+fs.readFileSync('src/'+f,'utf8').split('\\n').length+' lines'))" })
```

Find all TODOs:
```
analyze({ language: "shell", code: "grep -rn TODO src/ || true" })
```

The analyze tool runs in a sandbox with no network access by default.
Output is automatically truncated to 5KB to save context.
