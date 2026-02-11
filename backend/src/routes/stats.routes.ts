import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireFeature } from '../middleware/requireFeature.js';
import * as statsController from '../controllers/stats.controller.js';

const router = Router();

router.use('/stats', authenticate as any);

router.get('/stats/dashboard', statsController.getDashboardStats as any);
router.get('/stats/requests-timeline', statsController.getRequestTimeline as any);
router.get('/stats/cost-breakdown', statsController.getCostBreakdown as any);
router.get('/stats/errors', statsController.getErrorStats as any);
router.get('/stats/optimization', requireFeature('cost_optimization') as any, statsController.getOptimization as any);
router.get('/stats/tools', requireFeature('tool_tracking') as any, statsController.getToolStats as any);

export default router;
