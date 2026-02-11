import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { generateApiKey } from '../utils/apiKey.js';
import { AppError, NotFoundError, ForbiddenError } from '../errors/AppError.js';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function getProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { requests: true } },
    },
  });
}

export async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: { select: { requests: true } },
    },
  });

  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new ForbiddenError('Access denied');

  return project;
}

export async function createProject(userId: string, data: z.infer<typeof createProjectSchema>) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { projects: true } } },
  });

  if (!user) throw new NotFoundError('User not found');

  if (user._count.projects >= user.projectLimit) {
    throw new AppError(
      `Project limit reached (${user.projectLimit}). Upgrade to create more projects.`,
      403,
      'PROJECT_LIMIT'
    );
  }

  return prisma.project.create({
    data: {
      name: data.name,
      apiKey: generateApiKey(),
      userId,
    },
  });
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: z.infer<typeof updateProjectSchema>
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new ForbiddenError('Access denied');

  return prisma.project.update({
    where: { id: projectId },
    data,
  });
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new ForbiddenError('Access denied');

  await prisma.project.delete({ where: { id: projectId } });
}

export async function regenerateKey(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new ForbiddenError('Access denied');

  return prisma.project.update({
    where: { id: projectId },
    data: { apiKey: generateApiKey() },
  });
}
