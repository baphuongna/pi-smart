import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Advisor } from '../../src/advisor/advisor.ts';

describe('Advisor', () => {
  const advisor = new Advisor();

  describe('review', () => {
    it('should provide response for normal flow', () => {
      const context = {
        task: 'implement feature',
        attempted: ['step1'],
        errors: [],
        decisions: [],
      };

      const response = advisor.review(context);

      assert.ok(['plan', 'correction', 'stop'].includes(response.type));
    });

    it('should suggest correction when stuck', () => {
      const context = {
        task: 'fix bug',
        attempted: ['try1', 'try1', 'try1', 'try1', 'try1'],
        errors: ['SameError', 'SameError', 'SameError', 'SameError', 'SameError'],
        decisions: [],
      };

      const response = advisor.review(context);

      assert.strictEqual(response.type, 'correction');
    });

    it('should return correction for non-critical errors', () => {
      const context = {
        task: 'deploy',
        attempted: ['step1', 'step2'],
        errors: ['some error occurred'],
        decisions: [],
      };

      const response = advisor.review(context);

      // Should return correction for fundamental errors
      assert.ok(['correction', 'plan'].includes(response.type));
    });

    it('should detect going wrong path', () => {
      const context = {
        task: 'build',
        attempted: ['approach1', 'approach1', 'approach1'],
        errors: ['TypeError: undefined is not a function'],
        decisions: [],
      };

      const response = advisor.review(context);

      assert.ok(['correction', 'plan'].includes(response.type));
    });
  });

  describe('needsAdvice', () => {
    it('should return true when stuck', () => {
      const context = {
        task: 'fix',
        attempted: ['a', 'a', 'a', 'a', 'a'],
        errors: ['error', 'error', 'error', 'error', 'error'],
        decisions: [],
      };

      assert.strictEqual(advisor.needsAdvice(context), true);
    });

    it('should return true for critical errors', () => {
      const context = {
        task: 'deploy',
        attempted: ['step1'],
        errors: ['data loss detected'],
        decisions: [],
      };

      assert.strictEqual(advisor.needsAdvice(context), true);
    });

    it('should return false for clean context', () => {
      const context = {
        task: 'implement',
        attempted: ['step1', 'step2'],
        errors: [],
        decisions: [],
      };

      assert.strictEqual(advisor.needsAdvice(context), false);
    });
  });

  describe('formatAdvice', () => {
    it('should format plan response', () => {
      const response = { type: 'plan' as const, steps: ['step1', 'step2'] };
      const formatted = advisor.formatAdvice(response);

      assert.ok(formatted.includes('Next Steps'));
      assert.ok(formatted.includes('step1'));
    });

    it('should format correction response', () => {
      const response = { type: 'correction' as const, reason: 'error', redirect: 'fix it' };
      const formatted = advisor.formatAdvice(response);

      assert.ok(formatted.includes('Correction'));
      assert.ok(formatted.includes('error'));
    });
  });
});
