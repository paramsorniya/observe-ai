import { Router } from 'express';
import { validateApiKey } from '../middleware/validateApiKey.js';
import { usageLimiter } from '../middleware/usageLimiter.js';
import { sdkLimiter } from '../middleware/rateLimiter.js';
import * as sdkLogController from '../controllers/sdkLog.controller.js';

const router = Router();

router.post(
  '/sdk-log',
  sdkLimiter,
  validateApiKey as any,
  usageLimiter as any,
  sdkLogController.ingestLogs as any
);

export default router;
