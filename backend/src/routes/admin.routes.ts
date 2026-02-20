import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.use('/admin', authenticate as any, requireAdmin as any);

router.get('/admin/dashboard', adminController.getDashboard as any);
router.get('/admin/users', adminController.getUsers as any);
router.get('/admin/users/export', adminController.exportUsers as any);
router.get('/admin/users/segments', adminController.getSegmentCounts as any);
router.get('/admin/users/tags', adminController.getTags as any);
router.post('/admin/users/bulk-tag', adminController.bulkTag as any);
router.post('/admin/users/bulk-remove-tag', adminController.bulkRemoveTag as any);
router.get('/admin/users/:id', adminController.getUserDetail as any);
router.post('/admin/users/:id/ban', adminController.banUser as any);
router.post('/admin/users/:id/unban', adminController.unbanUser as any);
router.delete('/admin/users/:id', adminController.deleteUser as any);
router.post('/admin/users/:id/subscription', adminController.overrideSubscription as any);
router.get('/admin/revenue', adminController.getRevenue as any);
router.get('/admin/invoices', adminController.getInvoices as any);
router.get('/admin/subscription-analytics', adminController.getSubscriptionAnalytics as any);
router.get('/admin/subscription-events', adminController.getSubscriptionEvents as any);
router.get('/admin/system-stats', adminController.getSystemStats as any);
router.get('/admin/collaboration/stats', adminController.getCollaborationStats as any);
router.get('/admin/collaboration/projects', adminController.getCollaborationProjects as any);
router.get('/admin/collaboration/projects/:projectId', adminController.getCollaborationProjectDetail as any);
router.get('/admin/collaboration/invitations', adminController.getCollaborationInvitations as any);

export default router;
