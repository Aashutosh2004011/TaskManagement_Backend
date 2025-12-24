import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware to validate request body, query, or params using Zod schema
 */
export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      // Temporary logging to debug date format
      if (data && data.due_date) {
        console.log('[DEBUG] Received due_date:', data.due_date, '(type:', typeof data.due_date, ')');
      }
      const validated = await schema.parseAsync(data);
      req[source] = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
};
