/**
 * Command Permission System - Pattern from pi-crew role-permission.ts
 * 
 * Sandboxed command execution with read-only whitelist.
 */

export type PermissionMode = "read_only" | "workspace_write" | "danger_full_access";

const READ_ONLY_COMMANDS = new Set([
  "cat", "head", "tail", "ls", "find", "grep", "rg",
  "git", "gh", "jq", "wc", "diff", "sort", "uniq",
  "tree", "stat", "file", "basename", "dirname",
  "pwd", "env", "printenv", "date", "uname", "sha256sum"
]);

const DANGEROUS_PATTERNS = [
  /\s(-i|--in-place)\b/,
  /\brm\s/,
  /\bmv\s+.*\s+.*\//,
  /\bcp\s+.*\s+.*\//,
  /\bsudo\s/,
  /\bchmod\s+777\b/,
  /\bcurl\b.*\b-o\b/,
  /\bwget\b.*\b-O\b/,
];

export interface PermissionCheckResult {
  allowed: boolean;
  mode: PermissionMode;
  reason?: string;
}

export function isReadOnlyCommand(command: string): boolean {
  const first = command.trim().split(/\s+/)[0]?.split(/[\\/]/).pop() ?? "";
  if (!READ_ONLY_COMMANDS.has(first)) return false;
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) return false;
  }
  
  return true;
}

export function checkCommandPermission(
  mode: PermissionMode,
  command: string
): PermissionCheckResult {
  if (mode === "read_only" && !isReadOnlyCommand(command)) {
    return {
      allowed: false,
      mode,
      reason: `Command '${command}' is not in the read-only whitelist`
    };
  }
  
  if (mode === "read_only" && DANGEROUS_PATTERNS.some(p => p.test(command))) {
    return {
      allowed: false,
      mode,
      reason: `Command contains potentially dangerous pattern`
    };
  }
  
  return { allowed: true, mode };
}

export function getPermissionModeForRole(role: string): PermissionMode {
  const readOnlyRoles = new Set([
    "explorer", "reviewer", "security-reviewer", 
    "analyst", "critic", "planner", "writer"
  ]);
  const writeRoles = new Set(["executor", "test-engineer"]);
  
  if (readOnlyRoles.has(role)) return "read_only";
  if (writeRoles.has(role)) return "workspace_write";
  return "workspace_write";
}

export class SandboxPermissionManager {
  private mode: PermissionMode;
  
  constructor(mode: PermissionMode = "read_only") {
    this.mode = mode;
  }
  
  setMode(mode: PermissionMode): void {
    this.mode = mode;
  }
  
  check(command: string): PermissionCheckResult {
    return checkCommandPermission(this.mode, command);
  }
  
  filterCommands(commands: string[]): { allowed: string[]; denied: string[] } {
    const allowed: string[] = [];
    const denied: string[] = [];
    
    for (const cmd of commands) {
      const result = this.check(cmd);
      if (result.allowed) {
        allowed.push(cmd);
      } else {
        denied.push(cmd);
      }
    }
    
    return { allowed, denied };
  }
}
