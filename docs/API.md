# pi-smart API Reference

## Goal Analyzer

```typescript
import { analyzeGoal } from 'pi-smart';

const result = analyzeGoal('Implement user authentication with JWT');

console.log(result.intent);      // 'implement'
console.log(result.complexity); // 'medium' | 'high' | 'low'
console.log(result.roles);      // ['executor', 'reviewer']
console.log(result.suggestions); // ['security-reviewer']
```

## Caveman Mode (Token Compression)

```typescript
import { compressText, shouldCompress, formatCompression } from 'pi-smart';

// Compress text
const result = compressText(
  "I would recommend using useMemo for performance optimization",
  "full"
);

console.log(result.compressed);  // "use useMemo for optimization"
console.log(result.ratio);      // ~50

// Check if worth compressing
shouldCompress("long text here...", 100);  // true

// Format for display
formatCompression(result);
// "Original: 50 chars → Compressed: 25 chars (50% reduction)"
```

## Translation (I18n)

```typescript
import { t, setLocale, getLocale, getAvailableLocales } from 'pi-smart';

// Set locale
setLocale('vi');  // Vietnamese

// Translate
t('greeting');           // "Xin chào"
t('errors.notFound');   // "Không tìm thấy"
t('count.items', { n: 5 });  // "5 mục"

// Get current locale
getLocale();  // "vi"

// List available locales
getAvailableLocales();  // ['en', 'es', 'fr', 'pt-BR', 'vi']
```

## BM25 Search

```typescript
import { createBM25Search } from 'pi-smart';

const search = createBM25Search();

// Index documents
search.index('doc1', 'TypeScript is a typed language');
search.index('doc2', 'JavaScript is dynamic');

// Search
const results = search.search('typed language');
// [{ docId: 'doc1', score: 0.85 }, ...]
```

## Hook System

```typescript
import { createHookSystem, HookType } from 'pi-smart';

const hooks = createHookSystem();

// Register hook
hooks.register('pre-task', async (task) => {
  console.log('Starting:', task);
  return task;
});

// Register blocking hook
hooks.register('pre-commit', async (commit) => {
  if (!commit.message) {
    throw new Error('Commit message required');
  }
  return commit;
}, { blocking: true });

// Trigger
await hooks.trigger('pre-task', { name: 'test' });
```
