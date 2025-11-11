// backend/src/routes/admin.routes.ts

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';

const router = Router();

// Admin routes (read-only)
router.get('/ministry/:address', adminController.checkMinistryStatus);
router.get('/institutions', adminController.getInstitutions);
router.get('/institutions/:address', adminController.getInstitution);
router.get('/status', adminController.getAdminStatus);

// Note: No POST routes for institution registration
// This is handled by frontend via user's MetaMask

export default router;
