import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { canAccessFeature, TIER_LIMITS } from '../utils/features.js';
import { AppError, NotFoundError, ForbiddenError } from '../errors/AppError.js';
import type { ProjectMemberRole } from '@prisma/client';

// ── Schemas ───────────────────────────────────────────────────────────────
export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['ADMIN', 'VIEWER']).default('VIEWER'),
});

export const changeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'VIEWER']),
});

// ── Helpers ───────────────────────────────────────────────────────────────

/** Verify requesting user can manage a project's team (must be OWNER or ADMIN). */
async function requireManageAccess(projectId: string, requesterId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  // Owner always has access
  if (project.userId === requesterId) return;

  // Check if requester is an ADMIN member
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: requesterId } },
  });
  if (!member || member.role === 'VIEWER') {
    throw new ForbiddenError('Only project owners and admins can manage team members');
  }
}

/** Verify requesting user can change roles (OWNER only). */
async function requireOwnerAccess(projectId: string, requesterId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== requesterId) {
    throw new ForbiddenError('Only the project owner can change member roles');
  }
}

// ── Service Functions ─────────────────────────────────────────────────────

export async function getTeam(projectId: string, requesterId: string) {
  // Check access: owner or any member
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  const isOwner = project.userId === requesterId;
  if (!isOwner) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: requesterId } },
    });
    if (!membership) throw new ForbiddenError('Access denied');
  }

  const [owner, members, invitations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: project.userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.projectInvitation.findMany({
      where: { projectId, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: { invitedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    ownerId: project.userId,
    members: [
      // Owner always first
      { id: project.userId, role: 'OWNER' as ProjectMemberRole, joinedAt: project.createdAt, user: owner, isOwner: true },
      ...members.map((m) => ({ ...m, isOwner: false })),
    ],
    pendingInvitations: invitations,
  };
}

export async function inviteMember(
  projectId: string,
  requesterId: string,
  data: z.infer<typeof inviteMemberSchema>
) {
  await requireManageAccess(projectId, requesterId);

  // Check requester's tier supports team collaboration
  const requester = await prisma.user.findUnique({ where: { id: requesterId } });
  if (!requester) throw new NotFoundError('User not found');
  if (!canAccessFeature(requester.subscriptionTier, 'team_collaboration')) {
    throw new AppError('Team collaboration requires a Pro Plus plan or higher', 403, 'FEATURE_LOCKED');
  }

  // Enforce team member limit
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  const memberCount = await prisma.projectMember.count({ where: { projectId } });
  const limit = TIER_LIMITS[requester.subscriptionTier].teamMembers;
  // +1 for owner, count does not include owner row
  if (memberCount + 1 >= limit) {
    throw new AppError(
      `Team member limit reached (${limit} on ${requester.subscriptionTier} plan)`,
      403,
      'TEAM_LIMIT'
    );
  }

  // Check if email is already a member
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    if (existingUser.id === project.userId) {
      throw new AppError('This user is already the project owner', 400, 'ALREADY_MEMBER');
    }
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: existingUser.id } },
    });
    if (existing) throw new AppError('This user is already a team member', 400, 'ALREADY_MEMBER');
  }

  // Cancel any existing pending invite for this email
  await prisma.projectInvitation.updateMany({
    where: { projectId, invitedEmail: data.email, status: 'PENDING' },
    data: { status: 'REVOKED' },
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.projectInvitation.create({
    data: {
      projectId,
      invitedEmail: data.email,
      invitedById: requesterId,
      role: data.role,
      expiresAt,
    },
  });

  return invitation;
}

export async function revokeInvitation(
  projectId: string,
  invitationId: string,
  requesterId: string
) {
  await requireManageAccess(projectId, requesterId);

  const invitation = await prisma.projectInvitation.findFirst({
    where: { id: invitationId, projectId },
  });
  if (!invitation) throw new NotFoundError('Invitation not found');
  if (invitation.status !== 'PENDING') {
    throw new AppError('Invitation is no longer pending', 400, 'INVALID_STATUS');
  }

  return prisma.projectInvitation.update({
    where: { id: invitationId },
    data: { status: 'REVOKED' },
  });
}

export async function removeMember(
  projectId: string,
  memberUserId: string,
  requesterId: string
) {
  await requireManageAccess(projectId, requesterId);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  if (memberUserId === project.userId) {
    throw new ForbiddenError('Cannot remove the project owner');
  }

  // ADMINs can only remove VIEWERs; only OWNER can remove ADMINs
  const targetMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: memberUserId } },
  });
  if (!targetMember) throw new NotFoundError('Member not found');

  if (targetMember.role === 'ADMIN' && project.userId !== requesterId) {
    throw new ForbiddenError('Only the project owner can remove admins');
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: memberUserId } },
  });
}

export async function changeRole(
  projectId: string,
  memberUserId: string,
  requesterId: string,
  data: z.infer<typeof changeRoleSchema>
) {
  await requireOwnerAccess(projectId, requesterId);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  if (memberUserId === project.userId) {
    throw new ForbiddenError('Cannot change the owner\'s role');
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: memberUserId } },
  });
  if (!member) throw new NotFoundError('Member not found');

  return prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId: memberUserId } },
    data: { role: data.role },
  });
}

export async function acceptInvitation(token: string, acceptingUserId: string) {
  const invitation = await prisma.projectInvitation.findUnique({ where: { token } });
  if (!invitation) throw new NotFoundError('Invitation not found or invalid');
  if (invitation.status !== 'PENDING') {
    throw new AppError('This invitation is no longer valid', 400, 'INVALID_INVITATION');
  }
  if (invitation.expiresAt < new Date()) {
    await prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    throw new AppError('This invitation has expired', 400, 'EXPIRED_INVITATION');
  }

  const user = await prisma.user.findUnique({ where: { id: acceptingUserId } });
  if (!user) throw new NotFoundError('User not found');

  // Confirm the email matches (or allow any logged-in user to accept)
  // For security: enforce email match
  if (user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
    throw new ForbiddenError(
      `This invitation was sent to ${invitation.invitedEmail}. Please log in with that account.`
    );
  }

  // Check not already a member
  const project = await prisma.project.findUnique({ where: { id: invitation.projectId } });
  if (!project) throw new NotFoundError('Project not found');

  if (project.userId === acceptingUserId) {
    throw new AppError('You are already the owner of this project', 400, 'ALREADY_MEMBER');
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: invitation.projectId, userId: acceptingUserId } },
  });

  await prisma.$transaction([
    existing
      ? prisma.projectMember.update({
          where: { projectId_userId: { projectId: invitation.projectId, userId: acceptingUserId } },
          data: { role: invitation.role },
        })
      : prisma.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: acceptingUserId,
            role: invitation.role,
          },
        }),
    prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
  ]);

  return { projectId: invitation.projectId, projectName: project.name };
}

export async function getInvitationPreview(token: string) {
  const invitation = await prisma.projectInvitation.findUnique({
    where: { token },
    include: {
      project: { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
  if (!invitation) throw new NotFoundError('Invitation not found or invalid');
  if (invitation.status !== 'PENDING') {
    throw new AppError('This invitation is no longer valid', 400, 'INVALID_INVITATION');
  }
  if (invitation.expiresAt < new Date()) {
    throw new AppError('This invitation has expired', 400, 'EXPIRED_INVITATION');
  }
  return {
    projectName: invitation.project.name,
    invitedBy: invitation.invitedBy.name || invitation.invitedBy.email,
    role: invitation.role,
    invitedEmail: invitation.invitedEmail,
    expiresAt: invitation.expiresAt,
  };
}
