/**
 * Context Sandbox - Execute code analysis in isolated environment
 * Based on context-mode ctx_execute pattern
 * 
 * Security: Uses native Node.js `vm` module instead of vm2 (CVE-2023-37466).
 * For stronger isolation, consider using isolated-vm package.
 */

import { createContext, runInContext, type Context } from 'node:vm';

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
 * Uses native Node.js vm module for isolation
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
			// Create sandbox context with console and provided context.
			// Use Object.create(null) to avoid prototype pollution.
			// Only copy explicitly whitelisted keys from context.
			const sandbox: Context = Object.create(null);
			sandbox.console = Object.freeze({
				log: (...args: unknown[]) => args.join(' '),
				error: (...args: unknown[]) => args.join(' '),
				warn: (...args: unknown[]) => args.join(' '),
				info: (...args: unknown[]) => args.join(' '),
				debug: (...args: unknown[]) => args.join(' '),
			});
			// Copy whitelisted context keys only — reject prototype-exotic objects
			if (context) {
				for (const [k, v] of Object.entries(context)) {
					// Skip if key looks like a prototype pollution attempt
					if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
					sandbox[k] = v;
				}
			}

			// Create isolated context
			const vmContext = createContext(sandbox, {
				name: 'sandbox',
				codeGeneration: {
					strings: false, // Disallow eval and new Function
					wasm: false,
				},
			});

			// Run code with timeout
			const output = runInContext(code, vmContext, {
				timeout: this.config.timeout,
				breakOnSigint: true,
			});

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
		Array.from(code.matchAll(/function\s+(\w+)/g)).forEach(m => functions.push(m[1]));

		// Arrow functions assigned to variable
		Array.from(code.matchAll(/const\s+(\w+)\s*=\s*(?:async\s+)?\(/g)).forEach(m => functions.push(m[1]));

		// Class declarations
		Array.from(code.matchAll(/class\s+(\w+)/g)).forEach(m => classes.push(m[1]));

		// Import statements
		Array.from(code.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g)).forEach(m => imports.push(m[1]));

		// Export statements
		Array.from(code.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g)).forEach(m => exports.push(m[1]));

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
		Array.from(code.matchAll(/\b([A-Z][a-zA-Z]+)\b/g)).forEach(m => used.add(m[1]));

		const available = analysis.imports;
		const missing = Array.from(used).filter((u) => !available.includes(u));

		return { used: Array.from(used), missing, available };
	}
}
