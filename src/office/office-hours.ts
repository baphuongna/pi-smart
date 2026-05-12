/**
 * Office Hours - Product Requirements Interrogation
 * Based on gstack /office-hours pattern
 * Six forcing questions for product clarity
 */

export interface ProductContext {
  name?: string;
  problemStatement?: string;
  targetUsers?: string;
  currentSolution?: string;
  proposedSolution?: string;
  successMetrics?: string;
}

export interface OfficeHoursResult {
  answered: number;
  missing: string[];
  readiness: 'ready' | 'needs_work' | 'unclear';
  recommendations: string[];
  summary: string;
}

export interface SixQuestions {
  1: { question: string; description: string; required: boolean };
  2: { question: string; description: string; required: boolean };
  3: { question: string; description: string; required: boolean };
  4: { question: string; description: string; required: boolean };
  5: { question: string; description: string; required: boolean };
  6: { question: string; description: string; required: boolean };
}

/**
 * Six Forcing Questions for Product Clarity
 */
export const SIX_QUESTIONS: SixQuestions = {
  1: {
    question: 'What problem does this solve?',
    description: 'The core pain point or inefficiency that your users experience',
    required: true,
  },
  2: {
    question: 'Who is the user?',
    description: 'The specific person who will benefit from this solution',
    required: true,
  },
  3: {
    question: "What's the simplest version?",
    description: 'The minimum viable solution that delivers value',
    required: true,
  },
  4: {
    question: 'How do we measure success?',
    description: 'Specific, quantifiable metrics to track progress',
    required: true,
  },
  5: {
    question: 'What could go wrong?',
    description: 'Potential failure modes and risks',
    required: false,
  },
  6: {
    question: 'Why now?',
    description: 'Why is this the right time to build this?',
    required: true,
  },
};

/**
 * Office Hours Facilitator
 * Interrogate product requirements with six forcing questions
 */
export class OfficeHours {
  private answers: Map<number, string> = new Map();

  /**
   * Get all questions
   */
  getQuestions(): SixQuestions {
    return SIX_QUESTIONS;
  }

  /**
   * Answer a question
   */
  answer(questionNum: 1 | 2 | 3 | 4 | 5 | 6, answer: string): void {
    this.answers.set(questionNum, answer);
  }

  /**
   * Get answer for question
   */
  getAnswer(questionNum: number): string | undefined {
    return this.answers.get(questionNum);
  }

  /**
   * Get missing required answers
   */
  getMissingAnswers(): number[] {
    return Object.entries(SIX_QUESTIONS)
      .filter(([_, q]) => q.required && !this.answers.has(parseInt(_)))
      .map(([num]) => parseInt(num));
  }

  /**
   * Evaluate readiness based on answers
   */
  evaluate(): OfficeHoursResult {
    const missing = this.getMissingAnswers();
    const answered = 6 - missing.length;

    // Calculate readiness
    let readiness: 'ready' | 'needs_work' | 'unclear';

    if (missing.length === 0) {
      readiness = 'ready';
    } else if (missing.length <= 2) {
      readiness = 'needs_work';
    } else {
      readiness = 'unclear';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      answered,
      missing: missing.map((n) => SIX_QUESTIONS[n as keyof SixQuestions].question),
      readiness,
      recommendations,
      summary: this.generateSummary(),
    };
  }

  /**
   * Generate recommendations based on answers
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check Q1: Problem statement
    const q1 = this.answers.get(1);
    if (q1 && q1.length < 20) {
      recommendations.push('Q1: Expand on the problem statement. What specific pain points exist?');
    }

    // Check Q2: User definition
    const q2 = this.answers.get(2);
    if (q2 && !q2.match(/specific|particular|our|my/i)) {
      recommendations.push('Q2: Be more specific about the target user. "Everyone" is not a user.');
    }

    // Check Q3: MVP scope
    const q3 = this.answers.get(3);
    if (q3 && q3.length > 200) {
      recommendations.push('Q3: The simplest version sounds complex. Can you cut it in half?');
    }

    // Check Q4: Metrics
    const q4 = this.answers.get(4);
    if (q4 && !q4.match(/\d+%|metric|kpi|number|increase|decrease/i)) {
      recommendations.push('Q4: Add specific, quantifiable metrics. "Better" is not a metric.');
    }

    // Check Q5: Risks
    if (!this.answers.has(5)) {
      recommendations.push('Q5: Consider potential failure modes. What could go wrong?');
    }

    // Check Q6: Timing
    const q6 = this.answers.get(6);
    if (q6 && !q6.match(/now|urgent|blocking|quarter|deadline/i)) {
      recommendations.push('Q6: Justify why now is the right time. What changed?');
    }

    return recommendations;
  }

  /**
   * Generate summary
   */
  private generateSummary(): string {
    const result = this.evaluate();

    if (result.readiness === 'ready') {
      return '✅ Product requirements are clear and ready for implementation.';
    } else if (result.readiness === 'needs_work') {
      return `⚠️ Product requirements need clarification on ${result.missing.length} points.`;
    } else {
      return '❌ Product requirements are unclear. Answer the required questions.';
    }
  }

  /**
   * Format as report
   */
  formatReport(): string {
    const result = this.evaluate();
    const lines: string[] = [];

    lines.push('## Office Hours Report\n');
    lines.push(`**Readiness:** ${result.readiness === 'ready' ? '✅ Ready' : result.readiness === 'needs_work' ? '⚠️ Needs Work' : '❌ Unclear'}`);
    lines.push(`**Answered:** ${result.answered}/6 questions\n`);

    lines.push('### Six Forcing Questions\n');
    for (const [num, q] of Object.entries(SIX_QUESTIONS)) {
      const answer = this.answers.get(parseInt(num));
      const icon = answer ? '✅' : q.required ? '❌' : '⚪';
      lines.push(`${icon} **Q${num}: ${q.question}**`);
      if (answer) {
        lines.push(`   > ${answer}`);
      } else if (q.required) {
        lines.push(`   > *(required - not answered)*`);
      }
      lines.push('');
    }

    if (result.recommendations.length > 0) {
      lines.push('### Recommendations\n');
      for (const rec of result.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    lines.push(`**Summary:** ${result.summary}`);

    return lines.join('\n');
  }

  /**
   * Reset all answers
   */
  reset(): void {
    this.answers.clear();
  }

  /**
   * Load from product context
   */
  loadFromContext(context: ProductContext): void {
    if (context.problemStatement) {
      this.answer(1, context.problemStatement);
    }
    if (context.targetUsers) {
      this.answer(2, context.targetUsers);
    }
    if (context.proposedSolution) {
      this.answer(3, context.proposedSolution);
    }
    if (context.successMetrics) {
      this.answer(4, context.successMetrics);
    }
  }
}