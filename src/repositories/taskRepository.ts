import { getDatabase } from '../config/database';
import {
  Task,
  TaskHistory,
  TaskFilters,
  PaginationParams,
  PaginatedResponse,
} from '../types';
import { UpdateTaskInput } from '../validators/taskValidator';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class TaskRepository {
  /**
   * Create a new task
   */
  async create(taskData: Partial<Task>): Promise<Task> {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      const taskToInsert = {
        id: uuidv4(),
        ...taskData,
        status: taskData.status || 'pending',
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await db
        .from('tasks')
        .insert(taskToInsert)
        .select()
        .single();

      if (error) {
        logger.error('Error creating task:', error);
        throw new DatabaseError(`Failed to create task: ${error.message}`);
      }

      // Create history entry
      await this.createHistoryEntry({
        task_id: data.id,
        action: 'created',
        new_value: data,
      });

      return data as Task;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      logger.error('Unexpected error creating task:', error);
      throw new DatabaseError('Failed to create task');
    }
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task> {
    try {
      const db = getDatabase();

      const { data, error } = await db
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new NotFoundError(`Task with ID ${id} not found`);
      }

      return data as Task;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error finding task by ID:', error);
      throw new DatabaseError('Failed to find task');
    }
  }

  /**
   * Find all tasks with filters and pagination
   */
  async findAll(
    filters: TaskFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Task>> {
    try {
      const db = getDatabase();
      const {
        limit = 20,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = pagination;

      // Build query
      let query = db.from('tasks').select('*', { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Apply sorting and pagination
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error finding tasks:', error);
        throw new DatabaseError(`Failed to find tasks: ${error.message}`);
      }

      return {
        data: (data || []) as Task[],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      logger.error('Unexpected error finding tasks:', error);
      throw new DatabaseError('Failed to find tasks');
    }
  }

  /**
   * Update task by ID
   */
  async update(id: string, updates: UpdateTaskInput): Promise<Task> {
    try {
      const db = getDatabase();

      // Get old task data for history
      const oldTask = await this.findById(id);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await db
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating task:', error);
        throw new DatabaseError(`Failed to update task: ${error.message}`);
      }

      // Determine action type
      let action: TaskHistory['action'] = 'updated';
      if (updates.status && updates.status !== oldTask.status) {
        action = updates.status === 'completed' ? 'completed' : 'status_changed';
      }

      // Create history entry
      await this.createHistoryEntry({
        task_id: id,
        action,
        old_value: oldTask,
        new_value: data,
      });

      return data as Task;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) throw error;
      logger.error('Unexpected error updating task:', error);
      throw new DatabaseError('Failed to update task');
    }
  }

  /**
   * Delete task by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const db = getDatabase();

      // Check if task exists
      await this.findById(id);

      const { error } = await db.from('tasks').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting task:', error);
        throw new DatabaseError(`Failed to delete task: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) throw error;
      logger.error('Unexpected error deleting task:', error);
      throw new DatabaseError('Failed to delete task');
    }
  }

  /**
   * Get task history
   */
  async getHistory(taskId: string): Promise<TaskHistory[]> {
    try {
      const db = getDatabase();

      const { data, error } = await db
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('changed_at', { ascending: false });

      if (error) {
        logger.error('Error fetching task history:', error);
        throw new DatabaseError(`Failed to fetch task history: ${error.message}`);
      }

      return (data || []) as TaskHistory[];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      logger.error('Unexpected error fetching task history:', error);
      throw new DatabaseError('Failed to fetch task history');
    }
  }

  /**
   * Create a history entry
   */
  private async createHistoryEntry(
    historyData: Omit<TaskHistory, 'id' | 'changed_at'>
  ): Promise<void> {
    try {
      const db = getDatabase();

      const historyEntry = {
        id: uuidv4(),
        ...historyData,
        changed_at: new Date().toISOString(),
      };

      const { error } = await db.from('task_history').insert(historyEntry);

      if (error) {
        logger.error('Error creating history entry:', error);
        // Don't throw error for history entry failure, just log it
      }
    } catch (error) {
      logger.error('Unexpected error creating history entry:', error);
      // Don't throw error for history entry failure, just log it
    }
  }

  /**
   * Get task statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const db = getDatabase();

      // Get total count
      const { count: total } = await db
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      // Get counts by status
      const { data: statusData } = await db
        .from('tasks')
        .select('status');

      // Get counts by category
      const { data: categoryData } = await db
        .from('tasks')
        .select('category');

      // Get counts by priority
      const { data: priorityData } = await db
        .from('tasks')
        .select('priority');

      // Aggregate counts
      const byStatus: Record<string, number> = {};
      statusData?.forEach((item) => {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      });

      const byCategory: Record<string, number> = {};
      categoryData?.forEach((item) => {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      });

      const byPriority: Record<string, number> = {};
      priorityData?.forEach((item) => {
        byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
      });

      return {
        total: total || 0,
        byStatus,
        byCategory,
        byPriority,
      };
    } catch (error) {
      logger.error('Error getting task statistics:', error);
      throw new DatabaseError('Failed to get task statistics');
    }
  }
}

export const taskRepository = new TaskRepository();
