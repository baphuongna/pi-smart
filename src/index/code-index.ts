/**
 * Fast Code Index - Tree-sitter based code indexing
 * Based on codebase-memory-mcp patterns
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface Symbol {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant';
  file: string;
  line: number;
  endLine?: number;
  signature?: string;
  documentation?: string;
}

export interface CallGraph {
  caller: Symbol;
  callees: Symbol[];
}

export interface CodeIndexResult {
  symbols: Symbol[];
  callGraph: CallGraph[];
  files: number;
  indexTime: number;
}

interface IndexedFile {
  path: string;
  symbols: Symbol[];
  imports: string[];
}

/**
 * Fast Code Index for symbol lookup and call graph analysis
 * Uses regex-based parsing for simplicity
 * In production: use tree-sitter for accurate AST parsing
 */
export class CodeIndex {
  private files: Map<string, IndexedFile> = new Map();
  private symbols: Map<string, Symbol[]> = new Map();
  private extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];

  /**
   * Index a project directory
   */
  async indexProject(projectPath: string): Promise<CodeIndexResult> {
    const startTime = Date.now();
    const files = await this.findFiles(projectPath);

    for (const file of files) {
      await this.indexFile(file);
    }

    const allSymbols = [...this.symbols.values()].flat();
    const callGraph = this.buildCallGraph();

    return {
      symbols: allSymbols,
      callGraph,
      files: this.files.size,
      indexTime: Date.now() - startTime,
    };
  }

  /**
   * Index a single file
   */
  async indexFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const symbols = this.parseSymbols(content, filePath);
      const imports = this.parseImports(content);

      const indexed: IndexedFile = { path: filePath, symbols, imports };
      this.files.set(filePath, indexed);

      // Index by symbol name for fast lookup
      for (const symbol of symbols) {
        const existing = this.symbols.get(symbol.name) || [];
        existing.push(symbol);
        this.symbols.set(symbol.name, existing);
      }
    } catch {
      // Skip files that can't be read
    }
  }

  /**
   * Find all relevant files in a directory
   */
  private async findFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const traverse = async (currentDir: string) => {
      try {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            // Skip common ignored directories
            if (!['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(entry.name)) {
              await traverse(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (this.extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    };

    await traverse(dir);
    return files;
  }

  /**
   * Parse symbols from file content
   */
  private parseSymbols(content: string, filePath: string): Symbol[] {
    const symbols: Symbol[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Function declarations
      const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          type: 'function',
          file: filePath,
          line: i + 1,
          signature: line.trim(),
        });
      }

      // Class declarations
      const classMatch = line.match(/^(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          type: 'class',
          file: filePath,
          line: i + 1,
        });
      }

      // Interface declarations
      const interfaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
      if (interfaceMatch) {
        symbols.push({
          name: interfaceMatch[1],
          type: 'interface',
          file: filePath,
          line: i + 1,
        });
      }

      // Type aliases
      const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          type: 'type',
          file: filePath,
          line: i + 1,
        });
      }

      // Const declarations
      const constMatch = line.match(/^(?:export\s+)?const\s+(\w+)\s*=/);
      if (constMatch) {
        symbols.push({
          name: constMatch[1],
          type: 'constant',
          file: filePath,
          line: i + 1,
        });
      }
    }

    return symbols;
  }

  /**
   * Parse imports from file
   */
  private parseImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Find symbol definition
   */
  findDefinition(name: string): Symbol | undefined {
    const symbols = this.symbols.get(name);
    return symbols?.find((s) => s.type === 'function' || s.type === 'class');
  }

  /**
   * Find all references to a symbol
   */
  findReferences(name: string): Symbol[] {
    const symbols = this.symbols.get(name) || [];

    // Also search in file contents
    const references: Symbol[] = [...symbols];

    for (const [filePath, indexed] of this.files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(name) && !lines[i].includes(`function ${name}`)) {
          references.push({
            name,
            type: 'variable',
            file: filePath,
            line: i + 1,
          });
        }
      }
    }

    return references;
  }

  /**
   * Build call graph
   */
  private buildCallGraph(): CallGraph[] {
    const graphs: CallGraph[] = [];

    for (const [filePath, indexed] of this.files) {
      for (const symbol of indexed.symbols) {
        if (symbol.type !== 'function') continue;

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const callees: Symbol[] = [];

          // Find function calls in function body
          const funcStart = symbol.line - 1;
          const funcEnd = symbol.endLine ?? funcStart + 50;
          const funcBody = content.split('\n').slice(funcStart, funcEnd).join('\n');

          // Find symbol calls
          for (const [name, symbols] of this.symbols) {
            if (symbols.some((s) => s.file === filePath)) continue;
            if (funcBody.includes(`${name}(`)) {
              const def = symbols.find((s) => s.type === 'function');
              if (def) callees.push(def);
            }
          }

          if (callees.length > 0) {
            graphs.push({ caller: symbol, callees });
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }

    return graphs;
  }

  /**
   * Get call graph for a function
   */
  getCallGraph(funcName: string): CallGraph | undefined {
    const graphs = this.buildCallGraph();
    return graphs.find((g) => g.caller.name === funcName);
  }

  /**
   * Search symbols by name pattern
   */
  search(query: string): Symbol[] {
    const results: Symbol[] = [];
    const lowerQuery = query.toLowerCase();

    for (const symbols of this.symbols.values()) {
      for (const symbol of symbols) {
        if (symbol.name.toLowerCase().includes(lowerQuery)) {
          results.push(symbol);
        }
      }
    }

    return results;
  }

  /**
   * Get index statistics
   */
  getStats(): { files: number; symbols: number; types: Record<string, number> } {
    const types: Record<string, number> = {};
    let total = 0;

    for (const symbols of this.symbols.values()) {
      for (const symbol of symbols) {
        total++;
        types[symbol.type] = (types[symbol.type] || 0) + 1;
      }
    }

    return { files: this.files.size, symbols: total, types };
  }

  /**
   * Clear index
   */
  clear(): void {
    this.files.clear();
    this.symbols.clear();
  }
}
