import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import * as projectService from '../services/project.service.js';

export async function getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const projects = await projectService.getProjects(req.userId!);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const project = await projectService.getProject(req.params.id as string, req.userId!);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = projectService.createProjectSchema.parse(req.body);
    const project = await projectService.createProject(req.userId!, data);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = projectService.updateProjectSchema.parse(req.body);
    const project = await projectService.updateProject(req.params.id as string, req.userId!, data);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await projectService.deleteProject(req.params.id as string, req.userId!);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
}

export async function regenerateKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const project = await projectService.regenerateKey(req.params.id as string, req.userId!);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}
