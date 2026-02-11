import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/admin/login', authController.adminLogin);

export default router;
