import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = authService.registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = authService.loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const data = authService.loginSchema.parse(req.body);
    const result = await authService.adminLogin(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
