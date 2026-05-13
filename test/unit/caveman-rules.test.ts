import { describe, it } from 'node:test';
import assert from 'node:assert';
import { compressCaveman, getCompressionStats } from '../../src/compress/caveman-rules.js';

describe('Caveman Compression', () => {
  it('removes filler words', () => {
    const result = compressCaveman("This is just a test really");
    assert.ok(!result.includes('just'));
    assert.ok(!result.includes('really'));
  });

  it('preserves code blocks', () => {
    const input = "```js\nconst x = 1;\n```";
    const result = compressCaveman(input);
    assert.ok(result.includes('const x = 1'));
  });

  it('preserves URLs', () => {
    const input = "See https://example.com for details";
    const result = compressCaveman(input);
    assert.ok(result.includes('https://example.com'));
  });

  it('removes redundant phrases', () => {
    const result = compressCaveman("Make sure to run the tests in order to verify");
    assert.ok(!result.includes('in order to'));
  });

  it('calculates compression stats', () => {
    const stats = getCompressionStats("This is a long sentence", "This long sentence");
    assert.strictEqual(stats.originalChars, 23);
    assert.strictEqual(stats.compressedChars, 18);
    assert.ok(stats.savings > 0);
  });
});
