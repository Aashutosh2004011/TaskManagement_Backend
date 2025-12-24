import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { validateRequest } from '../middleware/validateRequest';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  uuidSchema,
} from '../validators/taskValidator';

const router = Router();

/**
 * @route   POST /api/tasks
 * @desc    Create a new task with auto-classification
 * @access  Public
 */
router.post('/', validateRequest(createTaskSchema, 'body'), (req, res, next) =>
  taskController.createTask(req as any, res, next)
);

/**
 * @route   GET /api/tasks
 * @desc    List all tasks with filters (status, category, priority)
 * @access  Public
 */
router.get('/', validateRequest(taskQuerySchema, 'query'), (req, res, next) =>
  taskController.getTasks(req as any, res, next)
);

/**
 * @route   GET /api/tasks/statistics
 * @desc    Get task statistics
 * @access  Public
 */
router.get('/statistics', (req, res, next) =>
  taskController.getStatistics(req, res, next)
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task details with history
 * @access  Public
 */
router.get('/:id', validateRequest(uuidSchema, 'params'), (req, res, next) =>
  taskController.getTaskById(req as any, res, next)
);

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Update task
 * @access  Public
 */
router.patch(
  '/:id',
  validateRequest(uuidSchema, 'params'),
  validateRequest(updateTaskSchema, 'body'),
  (req, res, next) => taskController.updateTask(req as any, res, next)
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Public
 */
router.delete('/:id', validateRequest(uuidSchema, 'params'), (req, res, next) =>
  taskController.deleteTask(req as any, res, next)
);

export default router;
