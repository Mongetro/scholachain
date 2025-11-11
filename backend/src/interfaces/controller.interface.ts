// backend/src/interfaces/controller.interface.ts

/**
 * Controller interface for standardizing request handlers
 * Provides a consistent structure for all controllers
 */

export interface IController {
  // Base controller interface for future extensibility
}

/**
 *Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 *Standard error response structure
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: any[];
  timestamp: string;
}
