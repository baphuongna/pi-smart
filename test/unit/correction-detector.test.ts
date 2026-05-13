import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createCorrectionDetector } from '../../src/analyze/correction-detector.js';

describe('Correction Detector', () => {
  it('detects strong correction patterns', () => {
    const detector = createCorrectionDetector();
    assert.strictEqual(detector.isCorrection("Don't do that"), true);
    assert.strictEqual(detector.isCorrection("I said to use npm"), true);
    assert.strictEqual(detector.isCorrection("Please don't use var"), true);
  });

  it('detects weak correction with directive', () => {
    const detector = createCorrectionDetector();
    assert.strictEqual(detector.isCorrection("No, use pnpm instead"), true);
    assert.strictEqual(detector.isCorrection("Actually, try this approach"), true);
  });

  it('ignores negative patterns', () => {
    const detector = createCorrectionDetector();
    assert.strictEqual(detector.isCorrection("No worries, that's fine"), false);
    assert.strictEqual(detector.isCorrection("No problem!"), false);
  });

  it('extracts correction info', () => {
    const detector = createCorrectionDetector();
    const info = detector.extractCorrection("Don't do that", "user said this");
    assert.ok(info);
    assert.strictEqual(info.type, 'strong');
    assert.strictEqual(info.originalText, "Don't do that");
  });

  it('categorizes corrections', () => {
    const detector = createCorrectionDetector();
    const info = detector.extractCorrection("wrong approach to fix this");
    assert.ok(info);
    assert.strictEqual(info.category, 'failure');
  });

  it('tracks recent corrections', () => {
    const detector = createCorrectionDetector();
    detector.extractCorrection("Don't do that approach");
    detector.extractCorrection("No, use npm instead");
    
    const recent = detector.getRecentCorrections(2);
    assert.strictEqual(recent.length, 2);
  });
});
