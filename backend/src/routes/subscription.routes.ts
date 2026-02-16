import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as subscriptionController from '../controllers/subscription.controller.js';

const router = Router();

router.post('/subscriptions/create-checkout', authenticate as any, subscriptionController.createCheckout as any);
router.post('/subscriptions/create-portal', authenticate as any, subscriptionController.createPortal as any);
router.post('/subscriptions/downgrade', authenticate as any, subscriptionController.requestDowngrade as any);
router.post('/subscriptions/cancel-downgrade', authenticate as any, subscriptionController.cancelDowngrade as any);
router.post('/subscriptions/mock-confirm', authenticate as any, subscriptionController.confirmMockPayment as any);

export default router;
