/**
 * Correction Detection - pi-smart
 * 
 * Two-pass filter for detecting user corrections:
 * - Strong patterns: always trigger
 * - Weak patterns: only if followed by directive
 * - Negative patterns: suppress even if positive matches
 */

export interface CorrectionInfo {
  type: 'strong' | 'weak';
  originalText: string;
  context: string;
  timestamp: number;
  category: 'correction' | 'failure' | 'preference';
}

/** Strong patterns - always trigger (high confidence corrections) */
export const CORRECTION_STRONG_PATTERNS: RegExp[] = [
  /don't do that/i,
  /not like that/i,
  /^I said\b/i,
  /^I told you\b/i,
  /we already discussed/i,
  /^please don't/i,
  /^that's not what I/i,
  /wrong approach/i,
  /that won't work/i,
  /stop doing/i,
];

/** Weak patterns - only trigger if followed by a directive */
export const CORRECTION_WEAK_PATTERNS: RegExp[] = [
  /^no[,\.\s!]/i,
  /^wrong[,\.\s!]/i,
  /^actually[,\.\s]/i,
  /^stop[,\.\s!]/i,
  /^wait[,\.\s]/i,
];

/** Directive words that confirm weak patterns */
const DIRECTIVE_WORDS = /\b(use|do|try|don't|stop|change|fix|instead|should|must|need to)\b/i;

/** Negative patterns - suppress trigger even if positive matches */
export const CORRECTION_NEGATIVE_PATTERNS: RegExp[] = [
  /^no worries/i,
  /^no problem/i,
  /^no thanks/i,
  /^no need/i,
  /^no[{,\.\s!]but/i,
  /^actually.{0,10}(looks? great|perfect|good|correct|right)/i,
  /^stop.{0,5}(there|here|for now|for a bit)/i,
  /^wrong.{0,5}(direction|path|way to ask)/i,
];

/**
 * Creates a correction detector with context tracking
 */
export function createCorrectionDetector() {
  // Track recent corrections for context
  const recentCorrections: CorrectionInfo[] = [];
  const MAX_RECENT = 10;
  
  return {
    /**
     * Check if text matches correction patterns
     */
    isCorrection(text: string): boolean {
      if (!text || text.length < 3) return false;
      
      // Check negative patterns first (suppression)
      for (const pattern of CORRECTION_NEGATIVE_PATTERNS) {
        if (pattern.test(text)) return false;
      }
      
      // Check strong patterns
      for (const pattern of CORRECTION_STRONG_PATTERNS) {
        if (pattern.test(text)) return true;
      }
      
      // Check weak patterns (need directive)
      for (const pattern of CORRECTION_WEAK_PATTERNS) {
        if (pattern.test(text) && DIRECTIVE_WORDS.test(text)) {
          return true;
        }
      }
      
      return false;
    },
    
    /**
     * Extract correction info from text
     */
    extractCorrection(text: string, context: string = ''): CorrectionInfo | null {
      if (!this.isCorrection(text)) return null;
      
      // Determine type
      let type: 'strong' | 'weak' = 'strong';
      
      for (const pattern of CORRECTION_WEAK_PATTERNS) {
        if (pattern.test(text)) {
          type = 'weak';
          break;
        }
      }
      
      // Determine category
      let category: CorrectionInfo['category'] = 'correction';
      if (/don't do that|stop doing|wrong approach/i.test(text)) {
        category = 'failure';
      } else if (/prefer|like|always|never/i.test(text)) {
        category = 'preference';
      }
      
      const info: CorrectionInfo = {
        type,
        originalText: text,
        context,
        timestamp: Date.now(),
        category
      };
      
      // Track recent
      recentCorrections.unshift(info);
      if (recentCorrections.length > MAX_RECENT) {
        recentCorrections.pop();
      }
      
      return info;
    },
    
    /**
     * Get recent corrections
     */
    getRecentCorrections(limit: number = 5): CorrectionInfo[] {
      return recentCorrections.slice(0, limit);
    },
    
    /**
     * Get correction summary for memory
     */
    getCorrectionSummary(): string {
      if (recentCorrections.length === 0) return '';
      
      const lines = ['## Recent Corrections\n'];
      for (const c of recentCorrections.slice(0, 5)) {
        lines.push(`- [${c.category}] ${c.originalText.slice(0, 100)}`);
      }
      return lines.join('\n');
    },
    
    /**
     * Clear recent corrections
     */
    clear(): void {
      recentCorrections.length = 0;
    }
  };
}
