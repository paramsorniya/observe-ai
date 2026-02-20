import { prisma } from './prisma.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';

/**
 * Verify that a user can access a project — either as the owner or as a ProjectMember.
 * Throws NotFoundError or ForbiddenError if access is denied.
 */
export async function verifyProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');

  if (project.userId !== userId) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new ForbiddenError('Access denied');
  }

  return project;
}
