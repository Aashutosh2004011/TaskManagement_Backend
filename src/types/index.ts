// Core type definitions for the Task Management system

export type TaskCategory = 'scheduling' | 'finance' | 'technical' | 'safety' | 'general';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface ExtractedEntities {
  dates?: string[];
  persons?: string[];
  locations?: string[];
  actionVerbs?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  due_date?: string;
  extracted_entities: ExtractedEntities;
  suggested_actions: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  action: 'created' | 'updated' | 'status_changed' | 'completed';
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  changed_by?: string;
  changed_at: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assigned_to?: string;
  due_date?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string;
  due_date?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  assigned_to?: string;
  search?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ClassificationResult {
  category: TaskCategory;
  priority: TaskPriority;
  extracted_entities: ExtractedEntities;
  suggested_actions: string[];
}
