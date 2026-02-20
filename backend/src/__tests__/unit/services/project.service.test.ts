import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectService from '../../../services/project.service.js';
import { prisma } from '../../mocks/prisma.js';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  projectLimit: 3,
  _count: { projects: 1 },
};

const mockProject = {
  id: 'proj-1',
  name: 'My Project',
  userId: 'user-1',
  apiKey: 'obs_testkey123456789012345678901234',
  isActive: true,
  createdAt: new Date(),
  _count: { requests: 42 },
};

describe('projectService — getProjects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns owned and member projects merged', async () => {
    const ownedProject = { ...mockProject, id: 'owned-1' };
    const memberProject = { ...mockProject, id: 'member-1', userId: 'other-user' };

    vi.mocked(prisma.project.findMany)
      .mockResolvedValueOnce([ownedProject] as any)
      .mockResolvedValueOnce([memberProject] as any);

    const result = await projectService.getProjects('user-1');

    expect(result).toHaveLength(2);
  });

  it('marks owned projects with isOwner: true', async () => {
    vi.mocked(prisma.project.findMany)
      .mockResolvedValueOnce([mockProject] as any)
      .mockResolvedValueOnce([] as any);

    const result = await projectService.getProjects('user-1');

    expect(result[0].isOwner).toBe(true);
  });

  it('marks member projects with isOwner: false', async () => {
    const memberProject = { ...mockProject, id: 'member-1', userId: 'other-user' };

    vi.mocked(prisma.project.findMany)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([memberProject] as any);

    const result = await projectService.getProjects('user-1');

    expect(result[0].isOwner).toBe(false);
  });

  it('deduplicates if same project appears in both lists', async () => {
    vi.mocked(prisma.project.findMany)
      .mockResolvedValueOnce([mockProject] as any)
      .mockResolvedValueOnce([mockProject] as any);

    const result = await projectService.getProjects('user-1');

    expect(result).toHaveLength(1);
  });

  it('returns empty array when user has no projects or memberships', async () => {
    vi.mocked(prisma.project.findMany)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    const result = await projectService.getProjects('user-1');

    expect(result).toHaveLength(0);
  });
});

describe('projectService — getProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when project does not exist', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    await expect(projectService.getProject('nonexistent', 'user-1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns project for owner', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any);

    const result = await projectService.getProject('proj-1', 'user-1');

    expect(result.id).toBe('proj-1');
  });

  it('throws 403 when user is neither owner nor member', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    await expect(projectService.getProject('proj-1', 'other-user'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns project for member (non-owner)', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      userId: 'member-user', projectId: 'proj-1', role: 'VIEWER',
    } as any);

    const result = await projectService.getProject('proj-1', 'member-user');

    expect(result.id).toBe('proj-1');
  });
});

describe('projectService — createProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(projectService.createProject('user-1', { name: 'New' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 PROJECT_LIMIT when user has reached project limit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, projectLimit: 1, _count: { projects: 1 },
    } as any);

    await expect(projectService.createProject('user-1', { name: 'One Too Many' }))
      .rejects.toMatchObject({ code: 'PROJECT_LIMIT' });
  });

  it('creates project with generated API key', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, projectLimit: 3, _count: { projects: 0 },
    } as any);
    vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any);

    await projectService.createProject('user-1', { name: 'New Project' });

    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'New Project',
          userId: 'user-1',
          apiKey: expect.stringMatching(/^obs_/),
        }),
      })
    );
  });

  it('returns the created project', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, _count: { projects: 0 },
    } as any);
    vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any);

    const result = await projectService.createProject('user-1', { name: 'New' });

    expect(result.name).toBe('My Project');
  });
});
