/**
 * BM25 Search - Full-text search with relevance ranking
 * Based on context-mode FTS5 BM25 pattern
 */

export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: string[];
}

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * BM25 ranking function implementation
 * Used by SQLite FTS5 internally, but this is for in-memory search
 */
export class BM25Search {
  private documents: Document[] = [];
  private k1 = 1.5; // Term frequency saturation
  private b = 0.75; // Length normalization

  constructor(documents: Document[] = []) {
    this.documents = documents;
  }

  /**
   * Add documents to the index
   */
  addDocument(doc: Document): void {
    this.documents.push(doc);
  }

  /**
   * Add multiple documents
   */
  addDocuments(docs: Document[]): void {
    this.documents.push(...docs);
  }

  /**
   * Search documents by query
   */
  search(query: string, limit = 10): SearchResult<Document>[] {
    const terms = this.tokenize(query);
    if (terms.length === 0) return [];

    const docLengths = this.documents.map((d) => this.tokenize(d.content).length);
    const avgLength = docLengths.reduce((a, b) => a + b, 0) / docLengths.length;

    const scores: { doc: Document; score: number }[] = [];

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const docTerms = this.tokenize(doc.content);
      const docLength = docLengths[i];

      let score = 0;
      for (const term of terms) {
        const tf = docTerms.filter((t) => t === term).length;
        if (tf > 0) {
          // Simplified BM25 formula
          const idf = Math.log((this.documents.length + 1) / (1 + 1)) + 1;
          const numerator = tf * (this.k1 + 1);
          const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / avgLength));
          score += idf * (numerator / denominator);
        }
      }

      if (score > 0) {
        scores.push({ doc, score });
      }
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ doc, score }) => ({
        item: doc,
        score,
        highlights: this.highlight(doc.content, terms),
      }));
  }

  /**
   * Tokenize text into terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  /**
   * Highlight matching terms in content
   */
  private highlight(content: string, terms: string[]): string[] {
    const highlights: string[] = [];
    const words = content.split(/\s+/);

    for (const term of terms) {
      for (const word of words) {
        if (word.toLowerCase().includes(term)) {
          highlights.push(word);
        }
      }
    }

    return [...new Set(highlights)].slice(0, 10);
  }

  /**
   * Get document count
   */
  get size(): number {
    return this.documents.length;
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents = [];
  }
}

/**
 * BM25 for structured data (key-value pairs)
 */
export class StructuredBM25<T extends Record<string, unknown>> {
  private documents: (T & { _id: string })[] = [];
  private searchableFields: (keyof T)[];

  constructor(searchableFields: (keyof T)[]) {
    this.searchableFields = searchableFields;
  }

  add(doc: T & { _id: string }): void {
    this.documents.push(doc);
  }

  search(query: string, limit = 10): { item: T; score: number }[] {
    const bm25 = new BM25Search();
    const docs: Document[] = this.documents.map((doc) => ({
      id: doc._id,
      content: this.searchableFields
        .map((f) => String(doc[f] ?? ''))
        .join(' '),
      metadata: doc as Record<string, unknown>,
    }));

    bm25.addDocuments(docs);
    const results = bm25.search(query, limit);

    return results.map((r) => ({
      item: r.item.metadata as T,
      score: r.score,
    }));
  }
}
