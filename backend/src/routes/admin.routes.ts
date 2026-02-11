import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.use('/admin', authenticate as any, requireAdmin as any);

router.get('/admin/dashboard', adminController.getDashboard as any);
router.get('/admin/users', adminController.getUsers as any);
router.get('/admin/users/:id', adminController.getUserDetail as any);
router.post('/admin/users/:id/ban', adminController.banUser as any);
router.post('/admin/users/:id/unban', adminController.unbanUser as any);
router.delete('/admin/users/:id', adminController.deleteUser as any);
router.post('/admin/users/:id/subscription', adminController.overrideSubscription as any);
router.get('/admin/revenue', adminController.getRevenue as any);
router.get('/admin/system-stats', adminController.getSystemStats as any);

export default router;
