/**
 * Caveman Compression Rules - pi-smart
 * ~75% token compression while preserving technical substance.
 */

// Patterns to REMOVE
const ARTICLES = /\b(a|an|the)\b/gi;
const FILLER = /\b(just|really|basically|actually|simply|essentially|generally)\b/gi;
const PLEASANTRIES = /\b(sure|certainly|of course|happy to|I'd recommend|I would recommend)\b/gi;
const HEDGING = /\b(it might be worth|you could consider|it would be good to|you should consider)\b/gi;

const REDUNDANT: Record<string, string> = {
  'in order to': 'to',
  'make sure to': 'ensure',
  'the reason is because': 'because',
  'due to the fact that': 'because',
  'at this point in time': 'now',
  'in the event that': 'if',
  'with regard to': 'about',
  'in spite of the fact that': 'although',
};

const SHORTEN_MAP: Record<string, string> = {
  'extensive': 'big',
  'implement a solution for': 'fix',
  'utilize': 'use',
  'subsequent': 'next',
  'previously': 'before',
  'approximately': '~',
  'demonstrate': 'show',
  'indicate': 'show',
  'additional': 'more',
  'fundamental': 'basic',
  'significant': 'big',
  'therefore': 'so',
  'however': 'but',
  'furthermore': '',
  'additionally': '',
  'consequently': 'so',
  'nevertheless': 'still',
};

const CODE_BLOCKS = /```[\s\S]*?```/g;
const INLINE_CODE = /`[^`]+`/g;
const URLS = /https?:\/\/[^\s]+/g;

export function compressCaveman(text: string): string {
  const preserved: string[] = [];
  
  let result = text;
  
  // Protect code blocks
  result = result.replace(CODE_BLOCKS, (match) => {
    preserved.push(match);
    return `__PRESERVED_${preserved.length - 1}__`;
  });
  
  // Protect inline code
  result = result.replace(INLINE_CODE, (match) => {
    preserved.push(match);
    return `__PRESERVED_${preserved.length - 1}__`;
  });
  
  // Protect URLs
  result = result.replace(URLS, (match) => {
    preserved.push(match);
    return `__PRESERVED_${preserved.length - 1}__`;
  });
  
  // Remove filler
  result = result.replace(FILLER, '');
  
  // Remove articles
  result = result.replace(ARTICLES, '');
  
  // Remove pleasantries
  result = result.replace(PLEASANTRIES, '');
  
  // Remove hedging
  result = result.replace(HEDGING, '');
  
  // Shorten phrases
  for (const [from, to] of Object.entries(REDUNDANT)) {
    result = result.replace(new RegExp(from, 'gi'), to);
  }
  
  // Shorten words
  for (const [from, to] of Object.entries(SHORTEN_MAP)) {
    result = result.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
  }
  
  // Collapse whitespace
  result = result.replace(/\s+/g, ' ').trim();
  
  // Restore preserved
  for (let i = 0; i < preserved.length; i++) {
    result = result.replace(`__PRESERVED_${i}__`, preserved[i]);
  }
  
  return result;
}

export function getCompressionStats(original: string, compressed: string): {
  originalChars: number;
  compressedChars: number;
  ratio: number;
  savings: number;
} {
  const originalChars = original.length;
  const compressedChars = compressed.length;
  const ratio = compressedChars / originalChars;
  const savings = ((1 - ratio) * 100);
  
  return {
    originalChars,
    compressedChars,
    ratio: Math.round(ratio * 100) / 100,
    savings: Math.round(savings * 10) / 10,
  };
}

export { SHORTEN_MAP };
