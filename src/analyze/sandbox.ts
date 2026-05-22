import * as child_process from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getLanguageConfig, sanitizeEnvironment } from "./languages.ts";

export interface SandboxResult {
	stdout: string;
	stderr: string;
	exitCode: number;
	timedOut: boolean;
	bytesProcessed: number;
	bytesReturned: number;
}

export interface SandboxOptions {
	language: string;
	code: string;
	cwd: string;
	timeout?: number;
	maxOutputBytes?: number;
	allowNetwork?: boolean;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_OUTPUT = 5120;

export async function executeInSandbox(options: SandboxOptions): Promise<SandboxResult> {
	const langConfig = getLanguageConfig(options.language);
	if (!langConfig) {
		return {
			stdout: "",
			stderr: `Unsupported language: ${options.language}. Supported: javascript, typescript, python, shell`,
			exitCode: 1,
			timedOut: false,
			bytesProcessed: 0,
			bytesReturned: 0,
		};
	}

	const timeout = options.timeout ?? DEFAULT_TIMEOUT;
	const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT;

	// Always use a temp directory for execution — never execute in user project
	const tmpDir = os.tmpdir();
	const randomId = crypto.randomBytes(8).toString("hex");
	const filename = path.join(tmpDir, `pi-smart-${process.pid}-${randomId}.${langConfig.extension}`);
	const executionDir = tmpDir; // Always run in tmp, NOT in user cwd

	try {
		fs.writeFileSync(filename, options.code, "utf-8");

		const command = langConfig.command[0]!;
		const args = [...langConfig.command.slice(1), ...langConfig.argsTemplate(filename)];
		const cleanEnv = sanitizeEnvironment(process.env, langConfig);

		// Block network by removing proxy vars
		if (!options.allowNetwork) {
			delete cleanEnv.HTTP_PROXY;
			delete cleanEnv.HTTPS_PROXY;
			delete cleanEnv.http_proxy;
			delete cleanEnv.https_proxy;
			delete cleanEnv.ALL_PROXY;
			delete cleanEnv.all_proxy;
		}

		const result = child_process.spawnSync(command, args, {
			cwd: executionDir, // Execute in tmp, never in user project
			env: cleanEnv,
			timeout,
			maxBuffer: 10 * 1024 * 1024, // 10MB stdout/stderr
			encoding: "utf-8",
			killSignal: "SIGKILL",
		});

		const stdout = (result.stdout as string) ?? "";
		const stderr = (result.stderr as string) ?? "";
		const exitCode = result.status ?? 1;
		const timedOut = result.signal === "SIGKILL" || result.error?.message?.includes("ETIMEDOUT") === true;

		// Output gating
		const bytesProcessed = Buffer.byteLength(stdout, "utf-8");
		let output = stdout;

		if (bytesProcessed > maxOutputBytes) {
			// Truncate: first 2KB + marker + last 2KB
			const firstPart = stdout.slice(0, 2048);
			const lastPart = stdout.slice(-2048);
			output = `${firstPart}\n[... ${(bytesProcessed - 4096)} bytes truncated ...]\n${lastPart}`;
		}

		const bytesReturned = Buffer.byteLength(output, "utf-8");

		return {
			stdout: output,
			stderr,
			exitCode,
			timedOut,
			bytesProcessed,
			bytesReturned,
		};
	} finally {
		// Clean up temp file
		try {
			fs.unlinkSync(filename);
		} catch {
			// Best effort cleanup
		}
	}
}