import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as subscriptionController from '../controllers/subscription.controller.js';

const router = Router();

router.post('/subscriptions/create-checkout', authenticate as any, subscriptionController.createCheckout as any);
router.post('/subscriptions/create-portal', authenticate as any, subscriptionController.createPortal as any);

export default router;
