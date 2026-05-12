/**
 * Context Sandbox - Execute code analysis in isolated environment
 * Based on context-mode ctx_execute pattern
 */

import { VM } from 'vm2';

export interface SandboxResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
}

export interface SandboxConfig {
  timeout?: number;
  memoryLimit?: number;
  allowNetwork?: boolean;
}

/**
 * Execute JavaScript/TypeScript code in isolated sandbox
 * Replaces multiple Read() calls with single execution
 */
export class ContextSandbox {
  private config: Required<SandboxConfig>;

  constructor(config: SandboxConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 5000,
      memoryLimit: config.memoryLimit ?? 128,
      allowNetwork: config.allowNetwork ?? false,
    };
  }

  /**
   * Execute code in sandbox and return result
   */
  async execute(code: string, context?: Record<string, unknown>): Promise<SandboxResult> {
    const startTime = Date.now();

    try {
      const vm = new VM({
        timeout: this.config.timeout,
        sandbox: {
          console: {
            log: (...args: unknown[]) => args.join(' '),
            error: (...args: unknown[]) => args.join(' '),
            warn: (...args: unknown[]) => args.join(' '),
          },
          ...context,
        },
        eval: false,
        wasm: false,
      });

      const output = vm.run(code);

      return {
        success: true,
        output: typeof output === 'string' ? output : JSON.stringify(output),
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze code structure without execution
   */
  analyze(code: string): {
    functions: string[];
    classes: string[];
    imports: string[];
    exports: string[];
  } {
    const functions: string[] = [];
    const classes: string[] = [];
    const imports: string[] = [];
    const exports: string[] = [];

    // Simple regex-based analysis
    // In production: use tree-sitter for accurate parsing

    // Function declarations
    const funcMatch = code.matchAll(/function\s+(\w+)/g);
    for (const match of funcMatch) {
      functions.push(match[1]);
    }

    // Arrow functions assigned to variable
    const arrowMatch = code.matchAll(/const\s+(\w+)\s*=/g);
    for (const match of arrowMatch) {
      functions.push(match[1]);
    }

    // Class declarations
    const classMatch = code.matchAll(/class\s+(\w+)/g);
    for (const match of classMatch) {
      classes.push(match[1]);
    }

    // Import statements
    const importMatch = code.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatch) {
      imports.push(match[1]);
    }

    // Export statements
    const exportMatch = code.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g);
    for (const match of exportMatch) {
      exports.push(match[1]);
    }

    return { functions, classes, imports, exports };
  }

  /**
   * Find dependencies in code
   */
  findDependencies(code: string): {
    used: string[];
    missing: string[];
    available: string[];
  } {
    const analysis = this.analyze(code);
    const used = new Set<string>();

    // Find variable usages
    const varMatch = code.matchAll(/\b([A-Z][a-zA-Z]+)\b/g);
    for (const match of varMatch) {
      used.add(match[1]);
    }

    const available = analysis.imports;
    const missing = [...used].filter((u) => !available.includes(u));

    return { used: [...used], missing, available };
  }
}
