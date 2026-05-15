/**
 * Caveman Mode Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  compressText,
  shouldCompress,
  formatCompression,
  recommendLevel,
  type CavemanLevel,
} from '../../src/compress/caveman-mode.ts';

describe('CavemanMode', () => {
  describe('compressText', () => {
    it('should compress full mode', () => {
      const result = compressText("I would recommend using useMemo here", "full");
      assert.ok(result.compressed.includes("useMemo"));
      assert.ok(!result.compressed.includes("I would recommend"));
    });
    
    it('should compress with all levels', () => {
      const lite = compressText("Sure! I would be happy to help", "lite");
      const full = compressText("Sure! I would be happy to help", "full");
      const ultra = compressText("Sure! I would be happy to help", "ultra");
      
      // All should compress some
      assert.ok(lite.ratio >= 0, "lite should have ratio >= 0");
      assert.ok(full.ratio >= 0, "full should have ratio >= 0");
      assert.ok(ultra.ratio >= 0, "ultra should have ratio >= 0");
      
      // All should be different from original
      assert.ok(lite.compressed !== lite.original);
      assert.ok(full.compressed !== full.original);
      assert.ok(ultra.compressed !== ultra.original);
    });
    
    it('should compress ultra mode aggressively', () => {
      const result = compressText("However, this is probably likely to cause issues", "ultra");
      assert.ok(!result.compressed.includes("However"));
      assert.ok(!result.compressed.includes("probably"));
      assert.ok(!result.compressed.includes("likely"));
    });
    
    it('should return valid ratio', () => {
      const result = compressText("This is a test string", "full");
      assert.ok(result.ratio >= 0);
      assert.ok(result.ratio <= 100);
      assert.strictEqual(result.level, "full");
    });
    
    it('should preserve technical terms', () => {
      const result = compressText("useCallback useMemo React", "full");
      assert.ok(result.compressed.includes("useCallback"));
      assert.ok(result.compressed.includes("useMemo"));
      assert.ok(result.compressed.includes("React"));
    });
  });
  
  describe('shouldCompress', () => {
    it('should return true for long text', () => {
      assert.strictEqual(shouldCompress("a".repeat(150)), true);
    });
    
    it('should return false for short text', () => {
      assert.strictEqual(shouldCompress("short"), false);
    });
    
    it('should respect minLength parameter', () => {
      assert.strictEqual(shouldCompress("12345", 10), false);
      assert.strictEqual(shouldCompress("12345678901", 10), true);
    });
  });
  
  describe('formatCompression', () => {
    it('should format result', () => {
      const result = compressText("test", "full");
      const formatted = formatCompression(result);
      assert.ok(formatted.includes("Original"));
      assert.ok(formatted.includes("Compressed"));
    });
  });
  
  describe('recommendLevel', () => {
    it('should recommend lite for review', () => {
      assert.strictEqual(recommendLevel("review"), "lite");
    });
    
    it('should recommend full for explanation', () => {
      assert.strictEqual(recommendLevel("explanation"), "full");
    });
    
    it('should recommend full for general', () => {
      assert.strictEqual(recommendLevel("general"), "full");
    });
  });
});
