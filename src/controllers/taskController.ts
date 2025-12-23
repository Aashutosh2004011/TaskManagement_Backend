import { Request, Response, NextFunction } from 'express';
import { taskRepository } from '../repositories/taskRepository';
import { classificationService } from '../services/classificationService';
import { CreateTaskInput, UpdateTaskInput, TaskQueryParams } from '../validators/taskValidator';
import { logger } from '../utils/logger';

export class TaskController {
  /**
   * POST /api/tasks - Create a new task with auto-classification
   */
  async createTask(
    req: Request<{}, {}, CreateTaskInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, description, assigned_to, due_date, category, priority } = req.body;

      // Perform auto-classification if not provided
      const classification = classificationService.classify(title, description);

      // Use user-provided values if available, otherwise use auto-classified values
      const taskData = {
        title,
        description,
        assigned_to,
        due_date,
        category: category || classification.category,
        priority: priority || classification.priority,
        status: 'pending' as const,
        extracted_entities: classification.extracted_entities,
        suggested_actions: classification.suggested_actions,
      };

      const task = await taskRepository.create(taskData);

      logger.info(`Task created successfully: ${task.id}`);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
          task,
          classification: {
            auto_category: classification.category,
            auto_priority: classification.priority,
            was_overridden: {
              category: category !== undefined && category !== classification.category,
              priority: priority !== undefined && priority !== classification.priority,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks - List all tasks with filters
   */
  async getTasks(
    req: Request<{}, {}, {}, TaskQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, category, priority, assigned_to, search, limit, offset, sortBy, sortOrder } =
        req.query;

      const filters = { status, category, priority, assigned_to, search };
      const pagination = { limit, offset, sortBy, sortOrder };

      const result = await taskRepository.findAll(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:id - Get task details with history
   */
  async getTaskById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const task = await taskRepository.findById(id);
      const history = await taskRepository.getHistory(id);

      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: {
          task,
          history,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:id - Update task
   */
  async updateTask(
    req: Request<{ id: string }, {}, UpdateTaskInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If title or description is updated, re-classify
      let classification;
      if (updates.title || updates.description) {
        const task = await taskRepository.findById(id);
        const newTitle = updates.title || task.title;
        const newDescription = updates.description || task.description;

        classification = classificationService.classify(newTitle, newDescription);

        // Update extracted entities and suggested actions if content changed
        if (updates.title || updates.description) {
          updates.extracted_entities = classification.extracted_entities;
          updates.suggested_actions = classification.suggested_actions;
        }
      }

      const updatedTask = await taskRepository.update(id, updates);

      logger.info(`Task updated successfully: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: {
          task: updatedTask,
          ...(classification && {
            classification: {
              auto_category: classification.category,
              auto_priority: classification.priority,
            },
          }),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tasks/:id - Delete task
   */
  async deleteTask(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      await taskRepository.delete(id);

      logger.info(`Task deleted successfully: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/statistics - Get task statistics
   */
  async getStatistics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const statistics = await taskRepository.getStatistics();

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
