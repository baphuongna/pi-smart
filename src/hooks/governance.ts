/**
 * Governance Hook System
 * Pattern: policy enforcement per hook, GovernableHook interface
 * Pattern from: pi-audit/src/governance/policy.ts (design intent)
 */

import { randomUUID } from 'node:crypto';
import type { HookName, HookContext, HookResult, HookOutcome } from './hook-system.ts';

/**
 * Governance policy for a single hook
 */
export interface GovernancePolicy {
  /** Hook name this policy applies to */
  hook: HookName;
  /** Whether this hook requires governance enforcement */
  enabled: boolean;
  /** Required privacy level for data accessed in this hook */
  privacyLevel: PrivacyLevel;
  /** Retention days for hook execution logs (0 = no retention) */
  retentionDays: number;
  /** Require explicit consent before execution */
  requireConsent: boolean;
  /** Block if policy is violated */
  enforceBlock: boolean;
  /** Custom policy rules */
  rules?: PolicyRule[];
}

/**
 * Privacy levels for data classification
 */
export type PrivacyLevel = 'public' | 'internal' | 'confidential' | 'restricted';

/**
 * A single policy rule condition and action
 */
export interface PolicyRule {
  /** Human-readable rule description */
  description: string;
  /** JSONata or simple expression to evaluate against hook context */
  condition: string;
  /** Action when condition is true */
  action: 'allow' | 'block' | 'log' | 'notify';
  /** Reason shown when action is taken */
  reason?: string;
}

/**
 * Consent record for audit trail
 */
export interface ConsentRecord {
  hookName: HookName;
  granted: boolean;
  timestamp: number;
  userId?: string;
  expiresAt?: number;
}

/**
 * GovernableHook wraps a HookDefinition with governance policy
 */
export interface GovernableHook {
  /** The base hook definition */
  baseHook: {
    name: HookName;
    mode: 'blocking' | 'non-blocking';
    handler: (ctx: HookContext) => HookResult | Promise<HookResult>;
    description?: string;
    priority?: number;
  };
  /** Governance policy for this hook */
  policy: GovernancePolicy;
  /** Consent check required before execution */
  requiresConsent?: boolean;
}

/**
 * Governance engine for hook execution
 */
export class GovernanceEngine {
  private policies = new Map<HookName, GovernancePolicy>();
  private consents = new Map<string, ConsentRecord>();
  private auditLog: GovernanceAuditEntry[] = [];

  /**
   * Register a governance policy for a hook
   */
  registerPolicy(policy: GovernancePolicy): void {
    this.policies.set(policy.hook, policy);
  }

  /**
   * Register multiple policies at once
   */
  registerPolicies(policies: GovernancePolicy[]): void {
    for (const policy of policies) {
      this.registerPolicy(policy);
    }
  }

  /**
   * Record user consent for a hook
   */
  recordConsent(record: ConsentRecord): void {
    const key = `${record.hookName}:${record.userId ?? 'anonymous'}`;
    this.consents.set(key, record);
  }

  /**
   * Check if consent is valid for a hook
   */
  hasValidConsent(hookName: HookName, userId?: string): boolean {
    const key = `${hookName}:${userId ?? 'anonymous'}`;
    const record = this.consents.get(key);
    if (!record) return false;
    if (!record.granted) return false;
    if (record.expiresAt && Date.now() > record.expiresAt) return false;
    return true;
  }

  /**
   * Evaluate a policy rule against hook context
   */
  evaluateRule(rule: PolicyRule, ctx: HookContext): boolean {
    try {
      // Simple key-based evaluation; extend with JSONata for complex cases
      const dataStr = JSON.stringify(ctx.data);
      // Basic string match for demonstration; real implementation would use JSONata
      return dataStr.includes(rule.condition.replace(/^['"]|['"]$/g, ''));
    } catch {
      return false;
    }
  }

  /**
   * Enforce governance policy for a hook execution
   * Returns modified HookContext if allowed, or blocked result if not
   */
  async enforce(hookName: HookName, ctx: HookContext): Promise<{
    allowed: boolean;
    result: HookResult;
    logged: boolean;
  }> {
    const policy = this.policies.get(hookName);
    if (!policy || !policy.enabled) {
      return { allowed: true, result: { outcome: 'allow' }, logged: false };
    }

    // Check consent requirement
    if (policy.requireConsent && !this.hasValidConsent(hookName)) {
      const blockedResult: HookResult = {
        outcome: 'block',
        reason: `Consent required for ${hookName} hook`,
        data: { privacyLevel: policy.privacyLevel }
      };
      this.logAudit('consent_missing', hookName, ctx, blockedResult);
      return { allowed: false, result: blockedResult, logged: true };
    }

    // Evaluate custom rules
    if (policy.rules) {
      for (const rule of policy.rules) {
        if (this.evaluateRule(rule, ctx)) {
          if (rule.action === 'block') {
            const blockedResult: HookResult = {
              outcome: 'block',
              reason: rule.reason ?? `Policy violation: ${rule.description}`
            };
            this.logAudit('policy_violation', hookName, ctx, blockedResult);
            return { allowed: false, result: blockedResult, logged: true };
          }
          if (rule.action === 'notify' || rule.action === 'log') {
            this.logAudit('policy_triggered', hookName, ctx, { outcome: 'diagnostic', reason: rule.description });
          }
        }
      }
    }

    // Log the execution
    this.logAudit('executed', hookName, ctx, { outcome: 'allow' });
    return { allowed: true, result: { outcome: 'allow' }, logged: true };
  }

  /**
   * Log a governance audit entry
   */
  private logAudit(
    eventType: string,
    hookName: HookName,
    ctx: HookContext,
    result: HookResult
  ): void {
    const entry: GovernanceAuditEntry = {
      id: `gov_${randomUUID()}`,
      eventType,
      hookName,
      timestamp: Date.now(),
      contextKeys: Object.keys(ctx.data),
      outcome: result.outcome,
      reason: result.reason
    };
    this.auditLog.push(entry);
  }

  /**
   * Get governance audit log
   */
  getAuditLog(): GovernanceAuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Get policy for a specific hook
   */
  getPolicy(hookName: HookName): GovernancePolicy | undefined {
    return this.policies.get(hookName);
  }
}

/**
 * Audit entry for governance events
 */
export interface GovernanceAuditEntry {
  id: string;
  eventType: string;
  hookName: HookName;
  timestamp: number;
  contextKeys: string[];
  outcome: HookOutcome;
  reason?: string;
}

/**
 * Default governance policies for lifecycle hooks
 */
export const DEFAULT_LIFECYCLE_POLICIES: GovernancePolicy[] = [
  {
    hook: 'Subagent',
    enabled: true,
    privacyLevel: 'internal',
    retentionDays: 30,
    requireConsent: false,
    enforceBlock: true,
    rules: [
      {
        description: 'Block subagent creation in restricted contexts',
        condition: '"restricted"',
        action: 'block',
        reason: 'Subagent creation not allowed in restricted contexts'
      }
    ]
  },
  {
    hook: 'SessionEnd',
    enabled: true,
    privacyLevel: 'confidential',
    retentionDays: 90,
    requireConsent: true,
    enforceBlock: false,
    rules: [
      {
        description: 'Log all session end events',
        condition: '""',
        action: 'log'
      }
    ]
  },
  {
    hook: 'Notification',
    enabled: true,
    privacyLevel: 'internal',
    retentionDays: 14,
    requireConsent: false,
    enforceBlock: false,
    rules: [
      {
        description: 'Block notifications with sensitive data',
        condition: '"password"',
        action: 'block',
        reason: 'Notifications cannot contain sensitive credentials'
      }
    ]
  },
  {
    hook: 'TaskCompleted',
    enabled: true,
    privacyLevel: 'internal',
    retentionDays: 60,
    requireConsent: false,
    enforceBlock: false
  },
  {
    hook: 'PostToolUseFailure',
    enabled: true,
    privacyLevel: 'internal',
    retentionDays: 30,
    requireConsent: false,
    enforceBlock: false,
    rules: [
      {
        description: 'Notify on critical tool failures',
        condition: '"rm -rf"',
        action: 'notify',
        reason: 'Critical tool failure detected'
      }
    ]
  },
  {
    hook: 'PreLlmContext',
    enabled: true,
    privacyLevel: 'confidential',
    retentionDays: 7,
    requireConsent: false,
    enforceBlock: false,
    rules: [
      {
        description: 'Block context with PII without consent',
        condition: '"ssn"',
        action: 'block',
        reason: 'PII detected in context without consent'
      }
    ]
  }
];

/**
 * Create a governed hook by wrapping a base hook with governance enforcement
 */
export function governHook<T extends { name: HookName; mode?: string; handler: (ctx: HookContext) => HookResult | Promise<HookResult> }>(
  baseHook: T,
  policy: GovernancePolicy
): GovernableHook {
  return {
    baseHook: baseHook as T & { mode: 'blocking' | 'non-blocking' },
    policy,
    requiresConsent: policy.requireConsent
  };
}