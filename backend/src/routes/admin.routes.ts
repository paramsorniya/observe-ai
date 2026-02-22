import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as adminController from '../controllers/admin.controller.js';
import {
  leadsQuerySchema,
  updateLeadSchema,
  grantEnterpriseSchema,
  updateConfigSchema,
  enterpriseUsersQuerySchema,
  getEnterpriseLeads,
  updateEnterpriseLead,
  grantEnterprise,
  updateEnterpriseConfig,
  getEnterpriseUsers,
} from '../services/enterprise.service.js';

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

/* ─── Enterprise Routes ─── */

router.get('/admin/enterprise/leads', async (req: any, res: any) => {
  try {
    const query = leadsQuerySchema.parse(req.query);
    const result = await getEnterpriseLeads(query);
    res.json(result);
  } catch (err: any) {
    if (err.name === 'ZodError') res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    else res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

router.put('/admin/enterprise/leads/:id', async (req: any, res: any) => {
  try {
    const data = updateLeadSchema.parse(req.body);
    const lead = await updateEnterpriseLead(req.params.id, data);
    res.json({ lead });
  } catch (err: any) {
    if (err.name === 'ZodError') res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    else if (err.name === 'NotFoundError') res.status(404).json({ error: 'NOT_FOUND', message: err.message });
    else res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

router.get('/admin/enterprise/users', async (req: any, res: any) => {
  try {
    const query = enterpriseUsersQuerySchema.parse(req.query);
    const result = await getEnterpriseUsers(query);
    res.json(result);
  } catch (err: any) {
    if (err.name === 'ZodError') res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    else res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

router.post('/admin/enterprise/grant/:userId', async (req: any, res: any) => {
  try {
    const config = grantEnterpriseSchema.parse(req.body);
    const result = await grantEnterprise(req.params.userId, config);
    res.json({ success: true, config: result });
  } catch (err: any) {
    if (err.name === 'ZodError') res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    else if (err.name === 'NotFoundError') res.status(404).json({ error: 'NOT_FOUND', message: err.message });
    else res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

router.put('/admin/enterprise/config/:userId', async (req: any, res: any) => {
  try {
    const data = updateConfigSchema.parse(req.body);
    const result = await updateEnterpriseConfig(req.params.userId, data);
    res.json({ success: true, config: result });
  } catch (err: any) {
    if (err.name === 'ZodError') res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    else if (err.name === 'NotFoundError') res.status(404).json({ error: 'NOT_FOUND', message: err.message });
    else res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

export default router;
