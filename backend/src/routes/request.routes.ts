import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireFeature } from '../middleware/requireFeature.js';
import * as requestController from '../controllers/request.controller.js';

const router = Router();

router.use('/requests', authenticate as any);

router.get('/requests', requestController.getRequests as any);
router.get('/requests/stats', requestController.getRequestStats as any);
router.get('/requests/export', requireFeature('export_csv') as any, requestController.exportCsv as any);
router.get('/requests/:id', requestController.getRequestById as any);

export default router;
