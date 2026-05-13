import assert from "node:assert/strict";
import test from "node:test";
import { isReadOnlyCommand, checkCommandPermission, SandboxPermissionManager } from "../../src/permission/command-permission.ts";

test("isReadOnlyCommand - returns true for safe commands", () => {
  assert.strictEqual(isReadOnlyCommand("cat file.txt"), true);
  assert.strictEqual(isReadOnlyCommand("grep pattern file"), true);
  assert.strictEqual(isReadOnlyCommand("ls -la"), true);
  assert.strictEqual(isReadOnlyCommand("git status"), true);
});

test("isReadOnlyCommand - returns false for dangerous commands", () => {
  assert.strictEqual(isReadOnlyCommand("rm -rf /tmp/test"), false);
  assert.strictEqual(isReadOnlyCommand("mv file1 file2"), false);
  assert.strictEqual(isReadOnlyCommand("curl -o output url"), false);
});

test("checkCommandPermission - blocks non-readonly in read_only mode", () => {
  const result = checkCommandPermission("read_only", "rm file.txt");
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.mode, "read_only");
});

test("checkCommandPermission - allows readonly in read_only mode", () => {
  const result = checkCommandPermission("read_only", "cat file.txt");
  assert.strictEqual(result.allowed, true);
});

test("SandboxPermissionManager - filters commands", () => {
  const manager = new SandboxPermissionManager("read_only");
  const { allowed, denied } = manager.filterCommands([
    "cat file.txt",
    "rm file.txt",
    "grep pattern file"
  ]);
  assert.deepStrictEqual(allowed, ["cat file.txt", "grep pattern file"]);
  assert.deepStrictEqual(denied, ["rm file.txt"]);
});
