import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as teamController from '../controllers/team.controller.js';

const router = Router();

// All team routes require authentication
router.use(authenticate as any);

// Project team management
router.get('/projects/:projectId/team', teamController.getTeam as any);
router.post('/projects/:projectId/team/invitations', teamController.inviteMember as any);
router.delete(
  '/projects/:projectId/team/invitations/:invitationId',
  teamController.revokeInvitation as any
);
router.delete('/projects/:projectId/team/members/:memberId', teamController.removeMember as any);
router.patch('/projects/:projectId/team/members/:memberId', teamController.changeRole as any);

// Accept invitation (requires auth — user must be logged in to accept)
router.get('/invitations/:token/preview', teamController.getInvitationPreview as any);
router.post('/invitations/:token/accept', teamController.acceptInvitation as any);

export default router;
