/**
 * Advisor Pattern - AI Advisory System
 * Based on rpiv-mono advisor-strategy pattern
 * Executor- advisor coordination for better decisions
 */

export type AdvisorResponse = 
  | { type: 'plan'; steps: string[] }
  | { type: 'correction'; reason: string; redirect: string }
  | { type: 'stop'; reason: string; escalate: boolean };

export interface AdvisorContext {
  task: string;
  attempted: string[];
  errors: string[];
  decisions: string[];
  code?: string;
}

export interface AdvisorConfig {
  model?: 'sonnet' | 'haiku';
  strictness?: 'lenient' | 'standard' | 'strict';
}

/**
 * Advisor - Provides guidance to executor agents
 * Never executes directly, only advises
 */
export class Advisor {
  private config: AdvisorConfig;

  constructor(config: AdvisorConfig = {}) {
    this.config = {
      model: config.model || 'sonnet',
      strictness: config.strictness || 'standard',
    };
  }

  /**
   * Review current state and provide guidance
   */
  review(context: AdvisorContext): AdvisorResponse {
    // Analyze what's been attempted
    const hasErrors = context.errors && context.errors.length > 0;
    const attempts = context.attempted ? context.attempted.length : 0;

    // Strategy: Analyze patterns and provide appropriate response
    if (this.isStuck(context)) {
      return this.suggestStuckResponse(context);
    }

    if (this.isGoingWrong(context)) {
      return this.suggestCorrection(context);
    }

    if (this.shouldEscalate(context)) {
      return {
        type: 'stop',
        reason: 'Issue requires human intervention',
        escalate: true,
      };
    }

    // Normal flow - provide next steps
    return this.suggestNextSteps(context);
  }

  /**
   * Check if executor is stuck in a loop
   */
  private isStuck(context: AdvisorContext): boolean {
    const errors = context.errors || [];
    const attempted = context.attempted || [];
    
    // Same error repeated
    if (errors.length >= 2) {
      const lastError = errors[errors.length - 1] || '';
      const sameErrorCount = errors.filter((e) => e === lastError).length;
      if (sameErrorCount >= 2) return true;
    }

    // Too many attempts without progress
    if (attempted.length >= 5 && errors.length >= attempted.length * 0.6) {
      return true;
    }

    return false;
  }

  /**
   * Check if path is going wrong
   */
  private isGoingWrong(context: AdvisorContext): boolean {
    const errors = context.errors || [];
    
    // Recent errors
    if (errors.length > 0) {
      const lastError = errors[errors.length - 1] || '';
      if (this.isFundamentalIssue(lastError)) {
        return true;
      }
    }

    // Circular attempts (only check if we have enough data)
    const attempted = context.attempted || [];
    if (attempted.length >= 3) {
      const recentAttempts = attempted.slice(-5);
      if (new Set(recentAttempts).size < 3) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if should escalate to human
   */
  private shouldEscalate(context: AdvisorContext): boolean {
    const errors = context.errors || [];
    
    // Critical errors
    const criticalPatterns = [
      /permission denied/i,
      /authentication failed/i,
      /data loss/i,
      /security breach/i,
      /unrecoverable/i,
    ];

    for (const error of errors) {
      if (criticalPatterns.some((p) => p.test(error))) {
        return true;
      }
    }

    // Too many attempts
    const attempted = context.attempted || [];
    if (attempted.length >= 20) {
      return true;
    }

    return false;
  }

  /**
   * Check if error is fundamental
   */
  private isFundamentalIssue(error: string): boolean {
    const fundamentalPatterns = [
      /typeerror.*undefined/i,
      /cannot read.*undefined/i,
      /module not found/i,
      /syntax error/i,
      /import.*failed/i,
    ];
    return fundamentalPatterns.some((p) => p.test(error));
  }

  /**
   * Suggest response when stuck
   */
  private suggestStuckResponse(context: AdvisorContext): AdvisorResponse {
    const errors = context.errors || [];
    const lastError = errors[errors.length - 1] || 'unknown error';

    return {
      type: 'correction',
      reason: `Stuck on repeated error: ${lastError}`,
      redirect: `Stop repeating the same approach. Try:\n` +
        `1. Read error message carefully and identify root cause\n` +
        `2. Search documentation for the specific error\n` +
        `3. Simplify the code to minimal reproduction\n` +
        `4. Ask for clarification if unclear`,
    };
  }

  /**
   * Suggest correction when going wrong
   */
  private suggestCorrection(context: AdvisorContext): AdvisorResponse {
    const errors = context.errors || [];
    const lastError = errors[errors.length - 1] || '';

    if (lastError.includes('undefined')) {
      return {
        type: 'correction',
        reason: 'Null/undefined error detected',
        redirect: 'Add null checks before accessing properties. Use optional chaining (?.) or nullish coalescing (??)',
      };
    }

    if (lastError.includes('module') || lastError.includes('import')) {
      return {
        type: 'correction',
        reason: 'Module/import error detected',
        redirect: 'Verify:\n1. Package is installed (npm install)\n2. Path is correct\n3. Export exists in source file\n4. Check for circular dependencies',
      };
    }

    if (lastError.includes('syntax')) {
      return {
        type: 'correction',
        reason: 'Syntax error detected',
        redirect: 'Fix syntax error. Check:\n1. Matching brackets/braces\n2. Proper punctuation\n3. Reserved words not used as names',
      };
    }

    return {
      type: 'correction',
      reason: 'Current approach is not working',
      redirect: 'Step back and reconsider the approach. What assumptions are being made?',
    };
  }

  /**
   * Suggest next steps
   */
  private suggestNextSteps(context: AdvisorContext): AdvisorResponse {
    const steps: string[] = [];

    // Check code if provided
    if (context.code) {
      // Check for common issues
      if (context.code.includes('any')) {
        steps.push('Consider adding proper types instead of "any"');
      }
      if (!context.code.includes('error') && !context.code.includes('catch')) {
        steps.push('Consider adding error handling');
      }
    }

    // Default steps based on task
    if (context.task.includes('implement') || context.task.includes('build')) {
      steps.push('Ensure tests pass before considering complete');
      steps.push('Check edge cases');
    }

    if (context.task.includes('fix') || context.task.includes('debug')) {
      steps.push('Verify the fix handles the specific error case');
      steps.push('Check for similar issues elsewhere');
    }

    if (steps.length === 0) {
      steps.push('Continue with current approach');
      steps.push('Monitor for new errors');
    }

    return { type: 'plan', steps };
  }

  /**
   * Quick check - returns true if advice is needed
   */
  needsAdvice(context: AdvisorContext): boolean {
    return (
      this.isStuck(context) ||
      this.isGoingWrong(context) ||
      this.shouldEscalate(context)
    );
  }

  /**
   * Format advice as readable message
   */
  formatAdvice(response: AdvisorResponse): string {
    switch (response.type) {
      case 'plan':
        return `**Next Steps:**\n${response.steps.map((s) => `- ${s}`).join('\n')}`;
      case 'correction':
        return `**Correction:** ${response.reason}\n\n**Redirect:**\n${response.redirect}`;
      case 'stop':
        return `**Stop:** ${response.reason}${response.escalate ? '\n\n⚠️ Escalating to human' : ''}`;
    }
  }
}