// backend/src/utils/logger.ts

/**
 * Unified logging service for ScholaChain backend
 * Provides consistent log formatting and levels for better monitoring and debugging
 */

export const logger = {
  /**
   * Informational messages for general application flow
   * @param message - Descriptive log message
   * @param meta - Additional context data (optional)
   */
  info: (message: string, meta?: any) =>
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || ''),

  /**
   * Error messages for exceptions and failures
   * @param message - Error description
   * @param error - Error object or additional context (optional)
   */
  error: (message: string, error?: any) =>
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || '',
    ),

  /**
   * Warning messages for potential issues
   * @param message - Warning description
   * @param meta - Additional context data (optional)
   */
  warn: (message: string, meta?: any) =>
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || ''),
};
