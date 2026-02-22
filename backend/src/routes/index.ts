import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import teamRoutes from './team.routes.js';
import sdkLogRoutes from './sdkLog.routes.js';
import requestRoutes from './request.routes.js';
import statsRoutes from './stats.routes.js';
import userRoutes from './user.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import adminRoutes from './admin.routes.js';
import enterpriseRoutes from './enterprise.routes.js';

const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(projectRoutes);
router.use(teamRoutes);
router.use(sdkLogRoutes);
router.use(requestRoutes);
router.use(statsRoutes);
router.use(userRoutes);
router.use(subscriptionRoutes);
router.use(adminRoutes);
router.use(enterpriseRoutes);

export default router;
