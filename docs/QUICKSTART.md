# Quick Start - pi-smart

## Installation

```bash
pi install npm:pi-smart
```

## Basic Usage

### Learn About Topic

```bash
# In your coding agent
/learn authentication
```

### Search Knowledge Base

```bash
/search JWT implementation
```

### Compress Output

```bash
/compress full
```

### Analyze Code

```bash
/analyze src/auth.ts
```

## Goal Analysis

```typescript
import { analyzeGoal } from 'pi-smart';

const result = analyzeGoal('Implement JWT authentication');
// → { intent: 'implement', complexity: 'medium', roles: ['executor'] }
```

## Token Compression

```typescript
import { compressText } from 'pi-smart';

// Full compression (~50%)
const compressed = compressText(longText, 'full');

// Ultra compression (~75%)
const ultra = compressText(longText, 'ultra');
```

## I18n

```typescript
import { t, setLocale } from 'pi-smart';

// Use Vietnamese
setLocale('vi');
console.log(t('greeting'));  // "Xin chào"

// Use Spanish
setLocale('es');
console.log(t('greeting'));  // "Hola"
```

## Next Steps

- Read [API.md](API.md) for full API reference
- Check [SPEC.md](../SPEC.md) for feature details
