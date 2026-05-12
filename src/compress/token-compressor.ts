/**
 * Token Compression - Reduce LLM token consumption
 * Based on rtk (Rust Token Killer) patterns
 * 60-90% token savings on common commands
 */

export interface CompressionConfig {
  /** Maximum lines to show */
  maxLines?: number;
  /** Show last N lines instead of first */
  showLast?: number;
  /** Truncate long lines */
  maxLineLength?: number;
  /** Remove empty lines */
  compact?: boolean;
  /** Show file tree instead of listing */
  treeMode?: boolean;
}

export interface CompressionResult {
  original: string;
  compressed: string;
  originalLines: number;
  compressedLines: number;
  savings: number; // percentage
  technique: string;
}

type CommandType = 'ls' | 'git-status' | 'git-diff' | 'git-log' | 'cat' | 'grep' | 'test' | 'tree' | 'docker-ps' | 'generic';

const DEFAULT_CONFIG: Required<CompressionConfig> = {
  maxLines: 50,
  showLast: 0,
  maxLineLength: 200,
  compact: true,
  treeMode: false,
};

/**
 * Token Compression utilities
 * Reduce output size while preserving key information
 */
export class TokenCompressor {
  private config: Required<CompressionConfig>;

  constructor(config: CompressionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compress command output
   */
  compress(output: string, type?: CommandType): CompressionResult {
    const originalLines = output.split('\n').length;
    let compressed: string;
    let technique: string;

    switch (type) {
      case 'ls':
        ({ compressed, technique } = this.compressLs(output));
        break;
      case 'git-status':
        ({ compressed, technique } = this.compressGitStatus(output));
        break;
      case 'git-diff':
        ({ compressed, technique } = this.compressGitDiff(output));
        break;
      case 'git-log':
        ({ compressed, technique } = this.compressGitLog(output));
        break;
      case 'cat':
        ({ compressed, technique } = this.compressCat(output));
        break;
      case 'grep':
        ({ compressed, technique } = this.compressGrep(output));
        break;
      case 'test':
        ({ compressed, technique } = this.compressTest(output));
        break;
      case 'tree':
        ({ compressed, technique } = this.compressTree(output));
        break;
      default:
        ({ compressed, technique } = this.compressGeneric(output));
    }

    const compressedLines = compressed.split('\n').length;
    const savings = ((originalLines - compressedLines) / originalLines) * 100;

    return {
      original: output,
      compressed,
      originalLines,
      compressedLines,
      savings: Math.max(0, savings),
      technique,
    };
  }

  /**
   * Detect command type from output
   */
  detectType(output: string, command?: string): CommandType {
    if (command) {
      if (command.includes('ls ') && !command.includes('git')) return 'ls';
      if (command.includes('git status')) return 'git-status';
      if (command.includes('git diff')) return 'git-diff';
      if (command.includes('git log')) return 'git-log';
      if (command.includes('cat ')) return 'cat';
      if (command.includes('grep ') || command.includes('rg ')) return 'grep';
      if (command.includes('test') || command.includes('jest') || command.includes('vitest')) return 'test';
      if (command.includes('tree ')) return 'tree';
    }

    // Auto-detect from content
    if (output.includes('On branch') && output.includes('Changes')) return 'git-status';
    if (output.includes('diff --git')) return 'git-diff';
    if (output.match(/^[a-f0-9]+\s+\w+\s+/m)) return 'git-log';
    if (output.includes('total ')) return 'ls';
    if (output.match(/^\d+ matches? in \d+ files?$/m)) return 'grep';

    return 'generic';
  }

  /**
   * Compress ls output
   */
  private compressLs(output: string): { compressed: string; technique: string } {
    const lines = output.split('\n').filter((l) => l.trim());

    // Show directories first, then files
    const dirs: string[] = [];
    const files: string[] = [];
    const others: string[] = [];

    for (const line of lines) {
      if (line.match(/^d/)) dirs.push(line.replace(/^d[rwx-]{9}/, '').trim());
      else if (line.match(/^-/)) files.push(line.replace(/^-[rwx-]{9}/, '').trim());
      else others.push(line);
    }

    const compressed = [
      'DIRS:',
      ...dirs.map((d) => `  📁 ${d}/`),
      '',
      'FILES:',
      ...files.map((f) => `  📄 ${f}`),
      ...others.length > 0 ? ['', 'OTHER:', ...others] : [],
    ].join('\n');

    return { compressed, technique: 'ls-grouped' };
  }

  /**
   * Compress git status
   */
  private compressGitStatus(output: string): { compressed: string; technique: string } {
    const lines = output.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      if (line.includes('On branch')) {
        result.push(`📍 ${line}`);
      } else if (line.includes('Changes not staged')) {
        result.push('📝 Modified (unstaged)');
      } else if (line.includes('Changes to be committed')) {
        result.push('✅ Staged');
      } else if (line.includes('Untracked files')) {
        result.push('🆕 Untracked');
      } else if (line.match(/^\s+modified:/)) {
        result.push(`  ${line.trim().replace('modified:', 'M')}`);
      } else if (line.match(/^\s+new file:/)) {
        result.push(`  ${line.trim().replace('new file:', 'A')}`);
      } else if (line.match(/^\s+deleted:/)) {
        result.push(`  ${line.trim().replace('deleted:', 'D')}`);
      }
    }

    return { compressed: result.join('\n'), technique: 'git-status-minimal' };
  }

  /**
   * Compress git diff
   */
  private compressGitDiff(output: string): { compressed: string; technique: string } {
    const lines = output.split('\n');
    const result: string[] = [];

    let inDiff = false;
    let fileContext = '';

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        inDiff = true;
        const match = line.match(/a\/(.+)\s+b\/(.+)/);
        if (match) {
          result.push(`\n📄 ${match[2]}`);
        }
      } else if (line.startsWith('@@')) {
        const context = line.match(/@@\s*-(\d+),?\d*\s*\+(\d+)/);
        if (context) {
          result.push(`  @@ -${context[1]} +${context[2]}`);
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        result.push(`  + ${this.truncateLine(line.slice(1))}`);
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        result.push(`  - ${this.truncateLine(line.slice(1))}`);
      }
    }

    return {
      compressed: result.length > 50 ? result.slice(0, 50).join('\n') + '\n  ... (truncated)' : result.join('\n'),
      technique: 'git-diff-context',
    };
  }

  /**
   * Compress git log
   */
  private compressGitLog(output: string): { compressed: string; technique: string } {
    const lines = output.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      const match = line.match(/^([a-f0-9]+)\s+\(([^)]+)\)\s+(.+)/);
      if (match) {
        result.push(`${match[1].slice(0, 7)} ${match[2]} ${match[3]}`);
      } else if (line.match(/^[a-f0-9]+/)) {
        const hash = line.match(/^([a-f0-9]+)/)?.[1];
        const rest = line.replace(/^[a-f0-9]+\s*/, '');
        result.push(`${hash?.slice(0, 7)} ${rest}`);
      }
    }

    // Limit to 20 commits
    const limited = result.slice(0, 20);
    if (result.length > 20) {
      limited.push(`... (${result.length - 20} more commits)`);
    }

    return { compressed: limited.join('\n'), technique: 'git-log-short' };
  }

  /**
   * Compress cat/file output
   */
  private compressCat(output: string): { compressed: string; technique: string } {
    let lines = output.split('\n');

    // Show first N and last N lines for long files
    if (this.config.showLast > 0 && lines.length > this.config.maxLines) {
      const first = lines.slice(0, 5);
      const last = lines.slice(-this.config.showLast);
      lines = [...first, `... (${lines.length - 10} lines) ...`, ...last];
    } else if (lines.length > this.config.maxLines) {
      lines = lines.slice(0, this.config.maxLines);
      lines.push(`... (${lines.length - this.config.maxLines} more lines)`);
    }

    return {
      compressed: lines.map((l) => this.truncateLine(l)).join('\n'),
      technique: 'cat-truncated',
    };
  }

  /**
   * Compress grep output
   */
  private compressGrep(output: string): { compressed: string; technique: string } {
    const lines = output.split('\n');
    const result: Map<string, { count: number; firstLine: string }> = new Map();

    for (const line of lines) {
      const match = line.match(/^([^:]+):(\d+):(.+)/);
      if (match) {
        const [, file, lineNum, content] = match;
        const entry = result.get(file) || { count: 0, firstLine: `${file}:${lineNum}: ${content}` };
        entry.count++;
        result.set(file, entry);
      } else if (line.trim()) {
        result.set(line, { count: 1, firstLine: line });
      }
    }

    const compressed: string[] = [];
    for (const [file, info] of result) {
      compressed.push(`${info.firstLine} (${info.count} matches)`);
    }

    return {
      compressed: compressed.join('\n'),
      technique: 'grep-deduplicated',
    };
  }

  /**
   * Compress test output
   */
  private compressTest(output: string): { compressed: string; technique: string } {
    const lines = output.split('\n');
    const result: string[] = [];

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const line of lines) {
      if (line.includes('PASS') || line.includes('passed')) passed++;
      if (line.includes('FAIL') || line.includes('failed')) failed++;
      if (line.includes('skip') || line.includes('SKIP')) skipped++;
    }

    // Extract key results
    for (const line of lines) {
      if (line.match(/^Tests:.*passed.*failed/)) {
        result.push(`📊 ${line.trim()}`);
      } else if (line.includes('FAIL')) {
        result.push(`❌ ${line.trim()}`);
      } else if (line.includes('PASS')) {
        result.push(`✅ ${line.trim()}`);
      }
    }

    // Summary
    const summary = `Tests: ${passed} passed, ${failed} failed, ${skipped} skipped`;
    if (!result.some((r) => r.includes('Tests:'))) {
      result.unshift(summary);
    }

    return { compressed: result.join('\n'), technique: 'test-summary' };
  }

  /**
   * Compress tree output
   */
  private compressTree(output: string): { compressed: string; technique: string } {
    if (this.config.treeMode) {
      // Depth limit for tree
      const lines = output.split('\n');
      const depthLimit = 3;
      const result: string[] = [];

      for (const line of lines) {
        const depth = (line.match(/^│\s*/g) || []).length + (line.match(/^├──\s|^└──\s/g) ? 1 : 0);
        if (depth <= depthLimit) {
          result.push(line);
        }
      }

      return {
        compressed: result.join('\n'),
        technique: 'tree-depth-limited',
      };
    }

    return this.compressGeneric(output);
  }

  /**
   * Generic compression
   */
  private compressGeneric(output: string): { compressed: string; technique: string } {
    let lines = output.split('\n');

    // Remove empty lines if compact
    if (this.config.compact) {
      lines = lines.filter((l) => l.trim());
    }

    // Limit lines
    if (lines.length > this.config.maxLines) {
      lines = lines.slice(0, this.config.maxLines);
      lines.push(`... (truncated, ${lines.length} lines shown)`);
    }

    return {
      compressed: lines.map((l) => this.truncateLine(l)).join('\n'),
      technique: 'generic-truncated',
    };
  }

  /**
   * Truncate long lines
   */
  private truncateLine(line: string): string {
    if (line.length > this.config.maxLineLength) {
      return line.slice(0, this.config.maxLineLength) + '...';
    }
    return line;
  }

  /**
   * Format compression report
   */
  formatReport(result: CompressionResult): string {
    const lines: string[] = [];

    lines.push(`## Token Compression Report\n`);
    lines.push(`**Savings:** ${result.savings.toFixed(1)}%`);
    lines.push(`**Technique:** ${result.technique}`);
    lines.push(`**Lines:** ${result.originalLines} → ${result.compressedLines}\n`);

    lines.push('### Compressed Output\n');
    lines.push('```');
    lines.push(result.compressed);
    lines.push('```');

    return lines.join('\n');
  }
}

/**
 * Quick compression helper
 */
export function compressOutput(
  output: string,
  type?: CommandType,
  config?: CompressionConfig
): string {
  const compressor = new TokenCompressor(config);
  return compressor.compress(output, type).compressed;
}

/**
 * Batch compression for multiple outputs
 */
export function compressBatch(
  outputs: { output: string; type?: CommandType; label?: string }[],
  config?: CompressionConfig
): Map<string, CompressionResult> {
  const compressor = new TokenCompressor(config);
  const results = new Map<string, CompressionResult>();

  for (const { output, type, label } of outputs) {
    const key = label || `output-${results.size}`;
    results.set(key, compressor.compress(output, type));
  }

  return results;
}