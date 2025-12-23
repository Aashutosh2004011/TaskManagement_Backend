import { z } from 'zod';

// Task category enum
export const taskCategorySchema = z.enum([
  'scheduling',
  'finance',
  'technical',
  'safety',
  'general',
]);

// Task priority enum
export const taskPrioritySchema = z.enum(['high', 'medium', 'low']);

// Task status enum
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed']);

// Create task validation schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  assigned_to: z
    .string()
    .max(100, 'Assigned to must be less than 100 characters')
    .trim()
    .optional(),
  due_date: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format')
    .optional(),
  category: taskCategorySchema.optional(),
  priority: taskPrioritySchema.optional(),
});

// Update task validation schema
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(1, 'Description cannot be empty')
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional(),
  category: taskCategorySchema.optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  assigned_to: z
    .string()
    .max(100, 'Assigned to must be less than 100 characters')
    .trim()
    .optional(),
  due_date: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format')
    .optional(),
  extracted_entities: z.any().optional(),
  suggested_actions: z.array(z.string()).optional(),
});

// Query parameters validation schema
export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  category: taskCategorySchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigned_to: z.string().optional(),
  search: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, {
      message: 'Offset must be non-negative',
    }),
  sortBy: z
    .enum(['created_at', 'updated_at', 'due_date', 'priority', 'title'])
    .optional()
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// UUID validation schema
export const uuidSchema = z.string().uuid('Invalid task ID format');

// Export types
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryParams = z.infer<typeof taskQuerySchema>;
