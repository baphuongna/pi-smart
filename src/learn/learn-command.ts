/**
 * Learn Command - Pattern from pi-hermes-memory learn-memory.ts
 * 
 * Interactive guide for users to learn about the extension.
 */

export interface LearnSection {
  id: string;
  title: string;
  icon: string;
  content: () => string[];
}

export class LearnCommand {
  private sections: LearnSection[] = [];

  constructor() {
    this.registerDefaultSections();
  }

  private registerDefaultSections(): void {
    this.sections = [
      {
        id: 'overview',
        title: 'Overview',
        icon: '📖',
        content: () => this.getOverviewContent(),
      },
      {
        id: 'features',
        title: 'Features',
        icon: '✨',
        content: () => this.getFeaturesContent(),
      },
      {
        id: 'commands',
        title: 'Commands',
        icon: '💻',
        content: () => this.getCommandsContent(),
      },
      {
        id: 'tips',
        title: 'Tips & Tricks',
        icon: '💡',
        content: () => this.getTipsContent(),
      },
      {
        id: 'architecture',
        title: 'Architecture',
        icon: '🏗️',
        content: () => this.getArchitectureContent(),
      },
    ];
  }

  /**
   * Get all available sections for selection
   */
  getSections(): { id: string; title: string; icon: string }[] {
    return this.sections.map(s => ({
      id: s.id,
      title: s.title,
      icon: s.icon,
    }));
  }

  /**
   * Get content for a specific section
   */
  getContent(sectionId: string): string[] {
    const section = this.sections.find(s => s.id === sectionId);
    return section ? section.content() : [`Section "${sectionId}" not found.`];
  }

  /**
   * Add a custom section
   */
  addSection(section: LearnSection): void {
    this.sections.push(section);
  }

  /**
   * Register a custom section
   */
  registerSection(
    id: string,
    title: string,
    icon: string,
    content: () => string[]
  ): void {
    this.sections.push({ id, title, icon, content });
  }

  private getOverviewContent(): string[] {
    return [
      '',
      '  ╔══════════════════════════════════════════════╗',
      '  ║           📖 Overview                      ║',
      '  ╚══════════════════════════════════════════════╝',
      '',
      '  pi-smart is an intelligent context management extension.',
      '  It helps you work smarter by:',
      '',
      '  • Analyzing your context and goals',
      '  • Searching relevant information',
      '  • Providing intelligent suggestions',
      '  • Managing conversation history',
      '',
      '  The extension is designed to reduce manual work',
      '  and improve AI assistance quality.',
      '',
    ];
  }

  private getFeaturesContent(): string[] {
    return [
      '',
      '  ╔══════════════════════════════════════════════╗',
      '  ║           ✨ Features                        ║',
      '  ╚══════════════════════════════════════════════╝',
      '',
      '  🧠 Context Analysis',
      '     Analyzes context to understand goals',
      '',
      '  🔍 Smart Search',
      '     BM25 and semantic search capabilities',
      '',
      '  💡 Advisor',
      '     Provides suggestions before execution',
      '',
      '  📦 Context Sandbox',
      '     Isolated context for safe evaluation',
      '',
      '  🗜️ Compression',
      '     Token compression for large contexts',
      '',
    ];
  }

  private getCommandsContent(): string[] {
    return [
      '',
      '  ╔══════════════════════════════════════════════╗',
      '  ║           💻 Commands                        ║',
      '  ╚══════════════════════════════════════════════╝',
      '',
      '  /smart-analyze     Analyze current context',
      '  /smart-search      Search for information',
      '  /smart-suggest     Get suggestions',
      '  /smart-learn       Learn about this extension',
      '',
    ];
  }

  private getTipsContent(): string[] {
    return [
      '',
      '  ╔══════════════════════════════════════════════╗',
      '  ║           💡 Tips & Tricks                    ║',
      '  ╚══════════════════════════════════════════════╝',
      '',
      '  ✅ DO:',
      '     • Use specific search queries',
      '     • Review suggestions before acting',
      '     • Use context sandbox for testing',
      '',
      '  ❌ DON\'T:',
      '     • Use vague search terms',
      '     • Ignore advisor warnings',
      '     • Skip context analysis for complex tasks',
      '',
    ];
  }

  private getArchitectureContent(): string[] {
    return [
      '',
      '  ╔══════════════════════════════════════════════╗',
      '  ║           🏗️ Architecture                    ║',
      '  ╚══════════════════════════════════════════════╝',
      '',
      '  ┌─────────────────────────────────────┐',
      '  │         Context Analysis            │',
      '  └─────────────────────────────────────┘',
      '                    ↓',
      '  ┌─────────────────────────────────────┐',
      '  │         Smart Search (BM25)         │',
      '  └─────────────────────────────────────┘',
      '                    ↓',
      '  ┌─────────────────────────────────────┐',
      '  │         Advisor & Suggestions         │',
      '  └─────────────────────────────────────┘',
      '',
    ];
  }
}
