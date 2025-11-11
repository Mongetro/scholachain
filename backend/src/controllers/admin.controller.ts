// backend/src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { adminService } from '../services/adminService.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Admin Controller - Read Only Operations
 * All write operations are handled by frontend via user's wallet
 */
export class AdminController {
  /**
   * Check if current user is Ministry of Education
   */
  public checkMinistryStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address required',
          message: 'Ethereum address is required',
        });
        return;
      }

      const isMinistry = await adminService.isMinistryOfEducation(address);

      res.json({
        success: true,
        data: {
          address,
          isMinistry,
        },
      });
    },
  );

  /**
   * Get all registered institutions (read-only)
   */
  public getInstitutions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const institutions = await adminService.getInstitutions();

      res.json({
        success: true,
        data: {
          institutions,
          total: institutions.length,
        },
      });
    },
  );

  /**
   * Get institution details (read-only)
   */
  public getInstitution = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address required',
          message: 'Institution address is required',
        });
        return;
      }

      const institution = await adminService.getInstitution(address);

      if (!institution) {
        res.status(404).json({
          success: false,
          error: 'Institution not found',
          message: 'No institution found with the provided address',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          institution,
        },
      });
    },
  );

  /**
   * Get admin service status
   */
  public getAdminStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const status = adminService.getStatus();

      res.json({
        success: true,
        data: {
          ...status,
          canRegisterInstitutions: false, // Always false - frontend handles writes
          architecture: 'web3-read-only',
          description:
            'Backend provides read-only access. Frontend handles transactions via user wallet.',
        },
      });
    },
  );
}

export const adminController = new AdminController();
