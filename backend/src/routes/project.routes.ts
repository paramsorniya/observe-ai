import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as projectController from '../controllers/project.controller.js';

const router = Router();

router.use('/projects', authenticate as any);

router.get('/projects', projectController.getProjects as any);
router.post('/projects', projectController.createProject as any);
router.get('/projects/:id', projectController.getProject as any);
router.put('/projects/:id', projectController.updateProject as any);
router.delete('/projects/:id', projectController.deleteProject as any);
router.post('/projects/:id/regenerate-key', projectController.regenerateKey as any);

export default router;
