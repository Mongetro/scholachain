// backend/src/controllers/health.controller.ts

/**
 * Health Controller
 * Handles health checks and service status endpoints
 * Essential for monitoring and load balancers
 */

import { Request, Response } from 'express';
import {
  ApiResponse,
  IController,
} from '../interfaces/controller.interface.js';

export class HealthController implements IController {
  /**
   * Health check endpoint for service monitoring
   * @param req - Express request object
   * @param res - Express response object
   */
  public healthCheck(req: Request, res: Response): void {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'OK',
        service: 'ScholaChain Backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  }

  /**
   * Detailed system status including dependencies
   * @param req - Express request object
   * @param res - Express response object
   */
  public async systemStatus(req: Request, res: Response): Promise<void> {
    // In a real implementation, you would check database, cache, etc.
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'operational',
        service: 'ScholaChain Backend',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  }

  /**
   * Simple test endpoint to verify API functionality
   * @param req - Express request object
   * @param res - Express response object
   */
  public test(req: Request, res: Response): void {
    const response: ApiResponse = {
      success: true,
      data: {
        message: 'ScholaChain Backend API is working!',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  }
}

// Export singleton instance
export const healthController = new HealthController();
