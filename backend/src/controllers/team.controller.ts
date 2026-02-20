import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as teamService from '../services/team.service.js';

export async function getTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const team = await teamService.getTeam(req.params.projectId, req.userId!);
    res.json(team);
  } catch (err) {
    next(err);
  }
}

export async function inviteMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = teamService.inviteMemberSchema.parse(req.body);
    const invitation = await teamService.inviteMember(req.params.projectId, req.userId!, data);
    res.status(201).json({ invitation });
  } catch (err) {
    next(err);
  }
}

export async function revokeInvitation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await teamService.revokeInvitation(
      req.params.projectId,
      req.params.invitationId,
      req.userId!
    );
    res.json({ message: 'Invitation revoked' });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await teamService.removeMember(req.params.projectId, req.params.memberId, req.userId!);
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
}

export async function changeRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = teamService.changeRoleSchema.parse(req.body);
    const member = await teamService.changeRole(
      req.params.projectId,
      req.params.memberId,
      req.userId!,
      data
    );
    res.json({ member });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await teamService.acceptInvitation(req.params.token, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getInvitationPreview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const preview = await teamService.getInvitationPreview(req.params.token);
    res.json(preview);
  } catch (err) {
    next(err);
  }
}
