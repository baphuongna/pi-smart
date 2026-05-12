import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TokenCompressor, compressOutput } from '../../src/compress/token-compressor.ts';

describe('TokenCompressor', () => {
  describe('compress', () => {
    it('should compress ls output', () => {
      const output = 'drwxr-xr-x  dir1/\n-rw-r--r--  file1.ts\n-rw-r--r--  file2.ts';
      const compressor = new TokenCompressor();
      const result = compressor.compress(output, 'ls');

      assert.ok(result.savings >= 0);
      assert.ok(result.compressed.includes('DIRS'));
      assert.ok(result.compressed.includes('FILES'));
    });

    it('should compress git status', () => {
      const output = 'On branch main\nChanges not staged:\n  modified:   src/index.ts';
      const compressor = new TokenCompressor();
      const result = compressor.compress(output, 'git-status');

      assert.ok(result.savings >= 0);
      assert.ok(result.technique === 'git-status-minimal');
    });

    it('should compress git diff', () => {
      const output = 'diff --git a/test.ts b/test.ts\n--- a/test.ts\n+++ b/test.ts\n@@ -1 +1 @@\n-old\n+new';
      const compressor = new TokenCompressor();
      const result = compressor.compress(output, 'git-diff');

      assert.ok(result.savings >= 0);
      assert.ok(result.compressed.includes('test.ts'));
    });

    it('should compress test output', () => {
      const output = 'Tests: 5 passed, 1 failed, 2 skipped\nFAIL src/test.ts';
      const compressor = new TokenCompressor();
      const result = compressor.compress(output, 'test');

      assert.ok(result.savings >= 0);
      assert.ok(result.compressed.includes('Tests:') || result.compressed.includes('passed'));
    });

    it('should detect type from output', () => {
      const compressor = new TokenCompressor();
      
      const gitStatusType = compressor.detectType('On branch main\nChanges not staged:', 'git status');
      assert.strictEqual(gitStatusType, 'git-status');
    });
  });

  describe('compressOutput helper', () => {
    it('should compress with default config', () => {
      const longOutput = Array(100).fill('line').join('\n');
      const compressed = compressOutput(longOutput, 'generic');

      assert.ok(compressed.length < longOutput.length);
    });
  });

  describe('savings calculation', () => {
    it('should calculate savings correctly', () => {
      const compressor = new TokenCompressor({ maxLines: 10 });
      const output = Array(100).fill('line').join('\n');
      const result = compressor.compress(output, 'generic');

      assert.ok(result.savings > 0);
      assert.ok(result.originalLines === 100);
      assert.ok(result.compressedLines <= 15); // maxLines + truncate message
    });
  });
});
