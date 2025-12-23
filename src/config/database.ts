import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';
import { logger } from '../utils/logger';

let supabase: SupabaseClient;

/**
 * Initialize Supabase client with service role key for admin operations
 */
export const initializeDatabase = (): SupabaseClient => {
  try {
    supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logger.info('Supabase client initialized successfully');
    return supabase;
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

/**
 * Get the initialized Supabase client instance
 */
export const getDatabase = (): SupabaseClient => {
  if (!supabase) {
    return initializeDatabase();
  }
  return supabase;
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const db = getDatabase();
    const { error } = await db.from('tasks').select('count', { count: 'exact', head: true });

    if (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }

    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test error:', error);
    return false;
  }
};
