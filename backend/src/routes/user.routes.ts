import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.use('/user', authenticate as any);

router.get('/user/profile', userController.getProfile as any);
router.put('/user/profile', userController.updateProfile as any);
router.delete('/user/account', userController.deleteAccount as any);
router.get('/user/export-data', userController.exportData as any);

export default router;
