import { TaskCategory, TaskPriority, ExtractedEntities, ClassificationResult } from '../types';
import * as chrono from 'chrono-node';

/**
 * Intelligent task classification service
 * Analyzes task content to automatically determine category, priority, entities, and suggested actions
 */

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<TaskCategory, string[]> = {
  scheduling: [
    'meeting', 'schedule', 'call', 'appointment', 'deadline', 'calendar',
    'meet', 'conference', 'discussion', 'session', 'reminder', 'event',
  ],
  finance: [
    'payment', 'invoice', 'bill', 'budget', 'cost', 'expense', 'financial',
    'pay', 'purchase', 'spending', 'money', 'price', 'fund', 'salary',
  ],
  technical: [
    'bug', 'fix', 'error', 'install', 'repair', 'maintain', 'debug',
    'code', 'deploy', 'server', 'database', 'api', 'software', 'system',
  ],
  safety: [
    'safety', 'hazard', 'inspection', 'compliance', 'ppe', 'risk',
    'security', 'emergency', 'incident', 'accident', 'protocol', 'regulation',
  ],
  general: [],
};

// Priority keywords mapping
const PRIORITY_KEYWORDS = {
  high: [
    'urgent', 'asap', 'immediately', 'today', 'critical', 'emergency',
    'priority', 'now', 'crucial', 'vital',
  ],
  medium: [
    'soon', 'this week', 'important', 'upcoming', 'moderate',
  ],
};

// Suggested actions by category
const SUGGESTED_ACTIONS: Record<TaskCategory, string[]> = {
  scheduling: [
    'Block calendar',
    'Send invite',
    'Prepare agenda',
    'Set reminder',
  ],
  finance: [
    'Check budget',
    'Get approval',
    'Generate invoice',
    'Update records',
  ],
  technical: [
    'Diagnose issue',
    'Check resources',
    'Assign technician',
    'Document fix',
  ],
  safety: [
    'Conduct inspection',
    'File report',
    'Notify supervisor',
    'Update checklist',
  ],
  general: [
    'Review details',
    'Assign owner',
    'Set deadline',
    'Track progress',
  ],
};

export class ClassificationService {
  /**
   * Classify a task based on its title and description
   */
  public classify(title: string, description: string): ClassificationResult {
    const content = `${title} ${description}`.toLowerCase();

    const category = this.detectCategory(content);
    const priority = this.detectPriority(content);
    const extracted_entities = this.extractEntities(title, description);
    const suggested_actions = this.getSuggestedActions(category);

    return {
      category,
      priority,
      extracted_entities,
      suggested_actions,
    };
  }

  /**
   * Detect task category based on keywords
   */
  private detectCategory(content: string): TaskCategory {
    const scores: Record<TaskCategory, number> = {
      scheduling: 0,
      finance: 0,
      technical: 0,
      safety: 0,
      general: 0,
    };

    // Count keyword matches for each category
    Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          scores[category as TaskCategory] += matches.length;
        }
      });
    });

    // Find category with highest score
    let maxScore = 0;
    let detectedCategory: TaskCategory = 'general';

    Object.entries(scores).forEach(([category, score]) => {
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category as TaskCategory;
      }
    });

    return detectedCategory;
  }

  /**
   * Detect task priority based on urgency keywords
   */
  private detectPriority(content: string): TaskPriority {
    // Check for high priority keywords
    for (const keyword of PRIORITY_KEYWORDS.high) {
      if (content.includes(keyword)) {
        return 'high';
      }
    }

    // Check for medium priority keywords
    for (const keyword of PRIORITY_KEYWORDS.medium) {
      if (content.includes(keyword)) {
        return 'medium';
      }
    }

    // Default to low priority
    return 'low';
  }

  /**
   * Extract entities from task content
   */
  private extractEntities(title: string, description: string): ExtractedEntities {
    const fullText = `${title} ${description}`;
    const entities: ExtractedEntities = {};

    // Extract dates and times using chrono-node
    const dates = chrono.parse(fullText);
    if (dates.length > 0) {
      entities.dates = dates.map((d: any) => d.text);
    }

    // Extract person names (after keywords like "with", "by", "assign to")
    const personPatterns = [
      /(?:with|by|assign(?:ed)?\s+(?:to)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /(?:contact|reach out to|notify|inform)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    ];

    const persons: string[] = [];
    personPatterns.forEach((pattern) => {
      const matches = fullText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          persons.push(match[1]);
        }
      }
    });

    if (persons.length > 0) {
      entities.persons = [...new Set(persons)]; // Remove duplicates
    }

    // Extract location references
    const locationPatterns = [
      /(?:at|in|location:|venue:)\s+([A-Z][a-z]+(?:\s+[A-Z0-9][a-z0-9]*)*)/g,
      /(?:room|office|building|floor)\s+([A-Z0-9]+)/gi,
    ];

    const locations: string[] = [];
    locationPatterns.forEach((pattern) => {
      const matches = fullText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          locations.push(match[1]);
        }
      }
    });

    if (locations.length > 0) {
      entities.locations = [...new Set(locations)];
    }

    // Extract action verbs
    const actionVerbs = [
      'schedule', 'prepare', 'review', 'complete', 'submit', 'send',
      'update', 'fix', 'repair', 'install', 'check', 'verify',
      'approve', 'confirm', 'notify', 'contact', 'assign',
    ];

    const foundVerbs: string[] = [];
    const words = fullText.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (actionVerbs.includes(cleanWord)) {
        foundVerbs.push(cleanWord);
      }
    });

    if (foundVerbs.length > 0) {
      entities.actionVerbs = [...new Set(foundVerbs)];
    }

    return entities;
  }

  /**
   * Get suggested actions based on category
   */
  private getSuggestedActions(category: TaskCategory): string[] {
    return SUGGESTED_ACTIONS[category];
  }
}

// Export singleton instance
export const classificationService = new ClassificationService();
