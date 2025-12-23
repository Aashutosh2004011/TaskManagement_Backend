import { ClassificationService } from '../classificationService';

describe('ClassificationService', () => {
  let classificationService: ClassificationService;

  beforeEach(() => {
    classificationService = new ClassificationService();
  });

  describe('Category Classification', () => {
    it('should classify scheduling tasks correctly', () => {
      const title = 'Schedule urgent meeting with team today';
      const description = 'Need to arrange a meeting about budget allocation';

      const result = classificationService.classify(title, description);

      expect(result.category).toBe('scheduling');
      expect(result.suggested_actions).toContain('Block calendar');
      expect(result.suggested_actions).toContain('Send invite');
    });

    it('should classify finance tasks correctly', () => {
      const title = 'Process invoice payment';
      const description = 'Pay the pending invoice for office supplies, budget approval needed';

      const result = classificationService.classify(title, description);

      expect(result.category).toBe('finance');
      expect(result.suggested_actions).toContain('Check budget');
      expect(result.suggested_actions).toContain('Get approval');
    });

    it('should classify technical tasks correctly', () => {
      const title = 'Fix critical bug in production';
      const description = 'Server error needs immediate repair and debugging';

      const result = classificationService.classify(title, description);

      expect(result.category).toBe('technical');
      expect(result.suggested_actions).toContain('Diagnose issue');
      expect(result.suggested_actions).toContain('Document fix');
    });

    it('should classify safety tasks correctly', () => {
      const title = 'Safety inspection required';
      const description = 'Conduct hazard inspection and ensure compliance with PPE regulations';

      const result = classificationService.classify(title, description);

      expect(result.category).toBe('safety');
      expect(result.suggested_actions).toContain('Conduct inspection');
      expect(result.suggested_actions).toContain('File report');
    });

    it('should default to general category when no keywords match', () => {
      const title = 'Random task';
      const description = 'This is a generic task with no specific keywords';

      const result = classificationService.classify(title, description);

      expect(result.category).toBe('general');
      expect(result.suggested_actions).toContain('Review details');
    });
  });

  describe('Priority Classification', () => {
    it('should classify high priority tasks correctly', () => {
      const testCases = [
        { title: 'Urgent task', description: 'needs immediate attention' },
        { title: 'Critical issue', description: 'fix this ASAP' },
        { title: 'Emergency meeting', description: 'today at 3pm' },
      ];

      testCases.forEach(({ title, description }) => {
        const result = classificationService.classify(title, description);
        expect(result.priority).toBe('high');
      });
    });

    it('should classify medium priority tasks correctly', () => {
      const testCases = [
        { title: 'Task for this week', description: 'complete soon' },
        { title: 'Important update', description: 'should be done this week' },
      ];

      testCases.forEach(({ title, description }) => {
        const result = classificationService.classify(title, description);
        expect(result.priority).toBe('medium');
      });
    });

    it('should default to low priority when no urgency keywords found', () => {
      const title = 'Regular task';
      const description = 'This can be done whenever convenient';

      const result = classificationService.classify(title, description);

      expect(result.priority).toBe('low');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract person names correctly', () => {
      const title = 'Meeting with John Smith';
      const description = 'Assign to Jane Doe and notify Tom Wilson';

      const result = classificationService.classify(title, description);

      expect(result.extracted_entities.persons).toBeDefined();
      expect(result.extracted_entities.persons?.length).toBeGreaterThan(0);
    });

    it('should extract dates correctly', () => {
      const title = 'Task due tomorrow';
      const description = 'Complete by next Friday at 3pm';

      const result = classificationService.classify(title, description);

      expect(result.extracted_entities.dates).toBeDefined();
      expect(result.extracted_entities.dates?.length).toBeGreaterThan(0);
    });

    it('should extract action verbs correctly', () => {
      const title = 'Schedule and prepare meeting';
      const description = 'Review documents, update slides, and send invites';

      const result = classificationService.classify(title, description);

      expect(result.extracted_entities.actionVerbs).toBeDefined();
      expect(result.extracted_entities.actionVerbs?.length).toBeGreaterThan(0);
      expect(result.extracted_entities.actionVerbs).toContain('schedule');
      expect(result.extracted_entities.actionVerbs).toContain('prepare');
    });

    it('should extract location references correctly', () => {
      const title = 'Meeting at Office Building A';
      const description = 'Location: Conference Room 301';

      const result = classificationService.classify(title, description);

      expect(result.extracted_entities.locations).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle the example from requirements correctly', () => {
      const title = 'Schedule urgent meeting with team today about budget allocation';
      const description = 'Need to discuss Q4 budget with the team immediately';

      const result = classificationService.classify(title, description);

      // Should detect scheduling category
      expect(result.category).toBe('scheduling');

      // Should detect high priority
      expect(result.priority).toBe('high');

      // Should suggest scheduling-related actions
      expect(result.suggested_actions).toContain('Block calendar');
      expect(result.suggested_actions).toContain('Send invite');

      // Should extract entities
      expect(result.extracted_entities).toBeDefined();
    });

    it('should handle tasks with multiple category keywords', () => {
      const title = 'Schedule meeting to review technical bug fixes and budget';
      const description = 'Urgent meeting needed to discuss repairs and payment approval';

      const result = classificationService.classify(title, description);

      // Should classify based on most frequent keywords
      expect(['scheduling', 'technical', 'finance']).toContain(result.category);

      // Should be high priority
      expect(result.priority).toBe('high');
    });

    it('should handle empty or minimal descriptions', () => {
      const title = 'Task';
      const description = '';

      const result = classificationService.classify(title, description);

      expect(result.category).toBeDefined();
      expect(result.priority).toBeDefined();
      expect(result.suggested_actions).toBeDefined();
      expect(result.suggested_actions.length).toBeGreaterThan(0);
    });
  });
});
